import ReactDOM from 'react-dom'
import React, { Suspense, useRef, useState, useEffect, Fragment } from 'react'
import { VRCanvas, Hands, Interactive, RayGrab, DefaultXRControllers, useInteraction, useXREvent } from '@react-three/xr'
import { useThree, useFrame } from '@react-three/fiber'
import { useGLTF, OrbitControls, Plane, Sphere, Sky, useMatcapTexture, Text } from '@react-three/drei'
import { usePlane, useBox, Physics, useSphere } from '@react-three/cannon'
import create from 'zustand'
import { joints } from './joints'
import './styles.css'

const useShoeStore = create((set) => ({
    current: 'Hover',
    selected: 'Selected',
    laces: '#0000ff',
    mesh: '#ffffff',
    caps: '#ffffff',
    inner: '#ffffff',
    sole: '#ffffff',
    stripes: '#ff0000',
    band: '#ffffff',
    patch: '#0000ff',
    setItemColor(item, color) {
        set({ [item]: color })
    }
}))

function Stand({ position, args = [6, 6, 6] }: any) {
    const [boxRef] = useBox(() => ({ position, mass: 1, args }))
    const [tex] = useMatcapTexture('C7C0AC_2E181B_543B30_6B6270')

    return (
        <Box scale={[0.5, 3, 0.5]} position={[0, -0.7, -0.45]} ref={boxRef} args={args as any} castShadow>
            <meshMatcapMaterial attach="material" matcap={tex as any} />
        </Box>
    )
}

function Box({ color, size, scale, children, ...rest }: any) {
    return (
        <mesh scale={scale} {...rest}>
            <boxBufferGeometry attach="geometry" args={size} />
            <meshPhongMaterial attach="material" color={color} />
            {children}
        </mesh>
    )
}

function Button(props: any) {
    const [hover, setHover] = useState(false)
    const [color, setColor] = useState()
    const items = useShoeStore((state) => state)

    const onSelect = () => {
        useShoeStore.setState({ laces: '#321029' })
        setColor(321029)
    }

    return (
        <Interactive onSelect={onSelect} onHover={() => setHover(true)} onBlur={() => setHover(false)}>
            <Box color={color} scale={hover ? [0.75, 0.75, 0.75] : [0.65, 0.65, 0.65]} size={[0.4, 0.1, 0.1]} {...props}>
                <Text position={[0, 0, 0.06]} fontSize={0.05} color="#000" anchorX="center" anchorY="middle">
                    {items.current}
                </Text>
            </Box>
        </Interactive>
    )
}

function Selected(props: any) {
    const [hover, setHover] = useState(false)
    const [color, setColor] = useState()
    const items = useShoeStore((state) => state)

    const onSelect = () => {
        useShoeStore.setState({ laces: '#321029' })
        setColor(321029)
    }

    return (
        <Interactive onSelect={onSelect} onHover={() => setHover(true)} onBlur={() => setHover(false)}>
            <Box color={color} scale={hover ? [0.75, 0.75, 0.75] : [0.65, 0.65, 0.65]} size={[0.4, 0.1, 0.1]} {...props}>
                <Text position={[0, 0, 0.06]} fontSize={0.05} color="#000" anchorX="center" anchorY="middle">
                    {items.selected}
                </Text>
            </Box>
        </Interactive>
    )
}

function JointCollider({ index, hand }: { index: number; hand: number }) {
    const { gl } = useThree()
    const handObj = (gl.xr as any).getHand(hand)
    const joint = handObj.joints[joints[index]] as any
    const size = joint.jointRadius ?? 0.0001
    const [tipRef, api] = useSphere(() => ({ args: size, position: [-1, 0, 0] }))
    useFrame(() => {
        if (joint === undefined) return
        api.position.set(joint.position.x, joint.position.y, joint.position.z)
    })

    return (
        <Sphere ref={tipRef} args={[size]}>
            <meshBasicMaterial transparent opacity={0} attach="material" />
        </Sphere>
    )
}

function HandsReady(props: any) {
    const [ready, setReady] = useState(false)
    const { gl } = useThree()
    useEffect(() => {
        if (ready) return
        const joint = (gl.xr as any).getHand(0).joints['index-finger-tip']
        if (joint?.jointRadius !== undefined) return
        const id = setInterval(() => {
            const joint = (gl.xr as any).getHand(0).joints['index-finger-tip']
            if (joint?.jointRadius !== undefined) {
                setReady(true)
            }
        }, 500)
        return () => clearInterval(id)
    }, [gl, ready])

    return ready ? props.children : null
}

const HandsColliders = (): any =>
    [...Array(25)].map((_, i) => (
        <Fragment key={i}>
            <JointCollider index={i} hand={0} />
            <JointCollider index={i} hand={1} />
        </Fragment>
    ))

function Shoe() {
    const ref = useRef()
    const { nodes, materials } = useGLTF('shoe-draco.glb')

    // const [hovered, setHovered] = useState(false)
    const items = useShoeStore((state) => state)

    // const interactAction = (material: any) => {
    //     let color = (Math.random() * 0xffffff) | 0
    //     // if (hovered) useShoeStore.setState({laces: '#321029'})
    // }

    // if (hovered) {
    //     useShoeStore.setState({ laces: '#321029' })
    //     setHovered(false)
    // }

    useFrame((state) => {
        const t = state.clock.getElapsedTime()
        ref.current.rotation.z = -0.2 - (1 + Math.sin(t / 1.5)) / 20
        ref.current.rotation.x = Math.cos(t / 4) / 8
        ref.current.rotation.y = Math.sin(t / 4) / 8
        // ref.current.position.y = (1 + Math.sin(t / 1.5)) / 10
    })

    const hovered = (item) => {
        useShoeStore.setState({ current: item })
        const color = '#' + (((1 << 24) * Math.random()) | 0).toString(16)
        items.setItemColor(item, color)
    }

    const onSelect = () => {
        useShoeStore.setState({ selected: items.current })
    }

    // Using the GLTFJSX output here to wire in app-state and hook up events
    return (
        <group scale={[0.16, 0.16, 0.16]} position={[0, 1.1, -0.4]}>
            <Button position={[-1, -1.7, 1]} rotation={[-0.7, 0, 0]} scale={[2, 2, 2]} item={'laces'} />
            <Selected position={[1, -1.7, 1]} rotation={[-0.7, 0, 0]} scale={[2, 2, 2]} item={'laces'} />
            <group ref={ref}>
                <Interactive onSelect={onSelect}>
                    <Interactive onHover={() => hovered('laces')}>
                        <mesh receiveShadow castShadow geometry={nodes.shoe.geometry} material={materials.laces} material-color={items.laces} />
                    </Interactive>
                    <Interactive onHover={() => hovered('mesh')}>
                        <mesh receiveShadow castShadow geometry={nodes.shoe_1.geometry} material={materials.mesh} material-color={items.mesh} />
                    </Interactive>
                    <Interactive onHover={() => hovered('caps')}>
                        <mesh receiveShadow castShadow geometry={nodes.shoe_2.geometry} material={materials.caps} material-color={items.caps} />
                    </Interactive>
                    <Interactive onHover={() => hovered('inner')}>
                        <mesh receiveShadow castShadow geometry={nodes.shoe_3.geometry} material={materials.inner} material-color={items.inner} />
                    </Interactive>
                    <Interactive onHover={() => hovered('sole')}>
                        <mesh receiveShadow castShadow geometry={nodes.shoe_4.geometry} material={materials.sole} material-color={items.sole} />
                    </Interactive>
                    <Interactive onHover={() => hovered('stripes')}>
                        <mesh receiveShadow castShadow geometry={nodes.shoe_5.geometry} material={materials.stripes} material-color={items.stripes} />
                    </Interactive>
                    <Interactive onHover={() => hovered('band')}>
                        <mesh receiveShadow castShadow geometry={nodes.shoe_6.geometry} material={materials.band} material-color={items.band} />
                    </Interactive>
                    <Interactive onHover={() => hovered('patch')}>
                        <mesh receiveShadow castShadow geometry={nodes.shoe_7.geometry} material={materials.patch} material-color={items.patch} />
                    </Interactive>
                </Interactive>
            </group>
        </group>
    )
}

function Scene() {
    const [floorRef] = usePlane(() => ({
        args: [10, 10],
        rotation: [-Math.PI / 2, 0, 0],
        position: [0, -0.9, 0],
        type: 'Static'
    }))
    return (
        <>
            <Sky distance={450000} sunPosition={[0, 1, 0]} inclination={0} azimuth={0.25} />
            <Hands />
            <HandsReady>
                <HandsColliders />
            </HandsReady>
            {/* {[...Array(7)].map((_, i) => (
        <Cube key={i} position={[0, 1.1 + 0.1 * i, -0.5]} />
      ))} */}
            <Shoe />
            <Stand />
            <spotLight position={[1, 8, 1.4]} angle={0.3} penumbra={1} color={'#fff'} intensity={5} castShadow />
            <Plane ref={floorRef} args={[10, 10]} receiveShadow>
                <meshStandardMaterial attach="material" color="#fff" />
            </Plane>
            <OrbitControls position={[1, 8, 1.4]} minPolarAngle={Math.PI / 3} maxPolarAngle={Math.PI / 3} enableZoom={true} enablePan={false} />
        </>
    )
}

const PrintColors = () => {
    const items = useShoeStore((state) => state)
    return <h1>{items.selected} around here ...</h1>
}

const App = () => (
    <div className={'container'}>
        <h1>Welcome to Night City</h1>
        <div className={'containerXR'}>
            <VRCanvas shadowMap>
                <Physics
                    gravity={[0, -2, 0]}
                    iterations={20}
                    defaultContactMaterial={{
                        friction: 0.09
                    }}>
                    <Scene />
                    <DefaultXRControllers />
                </Physics>
            </VRCanvas>
        </div>
        <PrintColors />
    </div>
)

ReactDOM.render(<App />, document.getElementById('root'))
