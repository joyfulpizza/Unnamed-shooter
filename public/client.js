const socket = io();

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

camera.position.set(0, 5, 10);

const players = {};
let myId;

socket.on("connect", () => {
    myId = socket.id;
});

function createMesh(id) {
    const geo = new THREE.BoxGeometry(1,2,1);
    const mat = new THREE.MeshBasicMaterial({color: id === myId ? 0x00ff00 : 0xff0000});
    const mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);
    players[id] = mesh;
}

socket.on("stateUpdate", (state) => {
    for (let id in state) {
        if (!players[id]) createMesh(id);
        const p = state[id];
        players[id].position.set(p.position.x, p.position.y, p.position.z);
    }
});

document.addEventListener("keydown", (e) => {
    const input = {x:0,z:0};
    if (e.key === "w") input.z = -1;
    if (e.key === "s") input.z = 1;
    if (e.key === "a") input.x = -1;
    if (e.key === "d") input.x = 1;
    socket.emit("move", input);
});

document.addEventListener("click", () => {
    const direction = {x:0,y:0,z:-1};
    socket.emit("shoot", direction);
});

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();
