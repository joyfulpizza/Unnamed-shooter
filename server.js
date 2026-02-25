import express from "express";
import http from "http";
import { Server } from "socket.io";
import * as CANNON from "cannon-es";

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

/* =========================
   GAME STATE
========================= */

const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);

const players = {};
const ROUND_TIME = 5 * 60 * 1000;
let roundStart = Date.now();

/* =========================
   PLAYER CREATION
========================= */

function createPlayer(id) {
    const shape = new CANNON.Box(new CANNON.Vec3(0.5, 1, 0.5));
    const body = new CANNON.Body({
        mass: 1,
        position: new CANNON.Vec3(
            (Math.random() - 0.5) * 20,
            5,
            (Math.random() - 0.5) * 20
        )
    });

    body.addShape(shape);
    world.addBody(body);

    players[id] = {
        id,
        body,
        health: 100,
        xp: 0,
        level: 1,
        alive: true
    };
}

/* =========================
   XP SCALING SYSTEM
========================= */

function calculateXP() {
    const aliveCount = Object.values(players).filter(p => p.alive).length;
    if (aliveCount === 0) return 0;
    return 100 / aliveCount;
}

/* =========================
   ROUND SYSTEM
========================= */

function checkRound() {
    const alive = Object.values(players).filter(p => p.alive);

    if (Date.now() - roundStart >= ROUND_TIME || alive.length <= 1) {
        if (alive[0]) {
            alive[0].xp += 500;
        }

        // Reset
        for (let id in players) {
            players[id].health = 100;
            players[id].alive = true;
            players[id].body.position.set(
                (Math.random() - 0.5) * 20,
                5,
                (Math.random() - 0.5) * 20
            );
        }

        roundStart = Date.now();
    }
}

/* =========================
   COMBAT (RAYCAST HITSCAN)
========================= */

function shoot(shooterId, direction) {
    const shooter = players[shooterId];
    if (!shooter || !shooter.alive) return;

    const ray = new CANNON.Ray(
        shooter.body.position,
        new CANNON.Vec3(
            shooter.body.position.x + direction.x * 50,
            shooter.body.position.y + direction.y * 50,
            shooter.body.position.z + direction.z * 50
        )
    );

    for (let id in players) {
        if (id === shooterId) continue;
        const target = players[id];
        if (!target.alive) continue;

        const result = new CANNON.RaycastResult();
        ray.intersectBody(target.body, result);

        if (result.hasHit) {
            const damage = 10 + shooter.level * 2;
            target.health -= damage;

            if (target.health <= 0) {
                target.alive = false;
                shooter.xp += calculateXP();
                shooter.level = 1 + Math.floor(shooter.xp / 500);
            }
        }
    }
}

/* =========================
   SOCKET HANDLING
========================= */

io.on("connection", (socket) => {
    createPlayer(socket.id);

    socket.on("move", (input) => {
        const player = players[socket.id];
        if (!player || !player.alive) return;

        player.body.velocity.x = input.x * 5;
        player.body.velocity.z = input.z * 5;
    });

    socket.on("shoot", (direction) => {
        shoot(socket.id, direction);
    });

    socket.on("disconnect", () => {
        if (players[socket.id]) {
            world.removeBody(players[socket.id].body);
            delete players[socket.id];
        }
    });
});

/* =========================
   GAME LOOP
========================= */

setInterval(() => {
    world.step(1 / 60);
    checkRound();

    const state = {};

    for (let id in players) {
        const p = players[id];
        state[id] = {
            position: p.body.position,
            health: p.health,
            level: p.level,
            alive: p.alive
        };
    }

    io.emit("stateUpdate", state);

}, 1000 / 60);

server.listen(process.env.PORT || 3000, () =>
    console.log("Server running")
);
