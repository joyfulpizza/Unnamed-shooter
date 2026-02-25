function checkHit(shooter, target, bulletRay) {
    // AABB hitbox detection
    const min = {
        x: target.position.x - target.hitbox.width/2,
        y: target.position.y - target.hitbox.height/2,
        z: target.position.z - target.hitbox.depth/2
    };

    const max = {
        x: target.position.x + target.hitbox.width/2,
        y: target.position.y + target.hitbox.height/2,
        z: target.position.z + target.hitbox.depth/2
    };

    return rayIntersectsAABB(bulletRay, min, max);
}

module.exports = { checkHit };
