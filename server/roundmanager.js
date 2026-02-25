const ROUND_TIME = 5 * 60 * 1000; // 5 minutes

let roundStart = Date.now();

function checkRound(players) {
    const alive = Object.values(players).filter(p => p.health > 0);

    if (Date.now() - roundStart >= ROUND_TIME || alive.length <= 1) {
        const winner = alive[0] || null;
        roundStart = Date.now();
        return winner;
    }

    return null;
}

module.exports = { checkRound };
