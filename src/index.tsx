import ReactDOM from 'react-dom'
import React, { Suspense, useRef, useState, useEffect, Fragment } from 'react'
import { VRCanvas, Hands, Interactive } from '@react-three/xr'
import { useThree, useFrame } from '@react-three/fiber'
import { useGLTF, Box, OrbitControls, Plane, Sphere, Sky, useMatcapTexture } from '@react-three/drei'
import { usePlane, useBox, Physics, useSphere } from '@react-three/cannon'
import create from 'zustand'
import { joints } from './joints'
import './styles.css'

const useStore = create((set) => ({
  color: '',
  removeAllBears: (val: string) => set({ color: val })
}))

const useShoeStore = create((set) => ({
  current: null,
  items: {
    laces: '#ffffff',
    mesh: '#ffffff',
    caps: '#ffffff',
    inner: '#ffffff',
    sole: '#ffffff',
    stripes: '#ffffff',
    band: '#ffffff',
    patch: '#ffffff'
  }
}))

function Cube({ position, args = [6, 6, 6] }: any) {
  const [boxRef] = useBox(() => ({ position, mass: 1, args }))
  const [tex] = useMatcapTexture('C7C0AC_2E181B_543B30_6B6270')

  return (
    <Box ref={boxRef} args={args as any} castShadow>
      <meshMatcapMaterial attach="material" matcap={tex as any} />
    </Box>
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
  const [color, setColor] = useState('blue')
  // Drei's useGLTF hook sets up draco automatically, that's how it differs from useLoader(GLTFLoader, url)
  // { nodes, materials } are extras that come from useLoader, these do not exist in threejs/GLTFLoader
  // nodes is a named collection of meshes, materials a named collection of materials
  const { nodes, materials } = useGLTF('shoe-draco.glb')

  // Using the GLTFJSX output here to wire in app-state and hook up events
  return (
    <group scale={[0.2, 0.2, 0.2]} position={[0, 1, 0.4]}>
      <mesh receiveShadow castShadow geometry={nodes.shoe.geometry} material={materials.laces} material-color={color} />
      <mesh receiveShadow castShadow geometry={nodes.shoe_1.geometry} material={materials.mesh} material-color={color} />
      <mesh receiveShadow castShadow geometry={nodes.shoe_2.geometry} material={materials.caps} material-color={color} />
      <mesh receiveShadow castShadow geometry={nodes.shoe_3.geometry} material={materials.inner} material-color={color} />
      <mesh receiveShadow castShadow geometry={nodes.shoe_4.geometry} material={materials.sole} material-color={color} />
      <mesh receiveShadow castShadow geometry={nodes.shoe_5.geometry} material={materials.stripes} material-color={color} />
      <mesh receiveShadow castShadow geometry={nodes.shoe_6.geometry} material={materials.band} material-color={color} />
      <mesh receiveShadow castShadow geometry={nodes.shoe_7.geometry} material={materials.patch} material-color={color} />
    </group>
  )
}

function HelloXR() {
  const [color, setColor] = useState('blue')

  const randomColor = () => {
    const colors = ['blue', 'orange', 'green', 'yellow', 'purple', 'pink', 'white', 'red']
    const randomElement = colors[Math.floor(Math.random() * colors.length)]

    return randomElement
  }

  const interactAction = () => {
    setColor(randomColor())
    useStore.setState({ color: color })
  }

  return (
    <>
      <Interactive onHover={interactAction} onBlur={interactAction}>
        <Shoe />
      </Interactive>
      <spotLight position={[1, 8, 1]} angle={0.3} penumbra={1} color={'fff'} intensity={20} castShadow />
    </>
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
      <HelloXR />
      <Plane ref={floorRef} args={[10, 10]} receiveShadow>
        <meshStandardMaterial attach="material" color="#fff" />
      </Plane>
      <OrbitControls position={[1, 2, 3]} minPolarAngle={Math.PI / 3} maxPolarAngle={Math.PI / 3} enableZoom={true} enablePan={false} />
    </>
  )
}

const PrintColors = () => {
  const color = useStore((state) => state.color)
  return <h1>{color} around here ...</h1>
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
        </Physics>
      </VRCanvas>
    </div>
    <PrintColors />
  </div>
)

ReactDOM.render(<App />, document.getElementById('root'))
