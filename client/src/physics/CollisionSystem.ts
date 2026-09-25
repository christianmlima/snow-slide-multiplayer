import { HubCollider, WarObstacle } from '../types/game.types';

export class CollisionSystem {
  public static resolveHubCollisions(
    px: number,
    pz: number,
    hubColliders: HubCollider[],
    playerRadius = 0.85
  ): { x: number; z: number } {
    let resX = px;
    let resZ = pz;

    for (let pass = 0; pass < 2; pass++) {
      for (const col of hubColliders) {
        if (col.type === 'circle') {
          const dx = resX - col.x;
          const dz = resZ - col.z;
          const distSq = dx * dx + dz * dz;
          const minDist = col.r + playerRadius;
          if (distSq < minDist * minDist) {
            const dist = Math.sqrt(distSq);
            if (dist > 0.0001) {
              const overlap = minDist - dist;
              resX += (dx / dist) * overlap;
              resZ += (dz / dist) * overlap;
            } else {
              resX += minDist;
            }
          }
        } else if (col.type === 'box') {
          const dx = resX - col.x;
          const dz = resZ - col.z;
          const cosA = Math.cos(col.angle);
          const sinA = Math.sin(col.angle);
          // Transformada inversa correta (mundo para local do colisor)
          const localX = dx * cosA - dz * sinA;
          const localZ = dx * sinA + dz * cosA;

          const clampedX = Math.max(-col.hw, Math.min(col.hw, localX));
          const clampedZ = Math.max(-col.hd, Math.min(col.hd, localZ));

          const diffX = localX - clampedX;
          const diffZ = localZ - clampedZ;
          const distSq = diffX * diffX + diffZ * diffZ;

          if (distSq < playerRadius * playerRadius) {
            let pushLocalX = 0;
            let pushLocalZ = 0;

            if (distSq > 0.00001) {
              const dist = Math.sqrt(distSq);
              const overlap = playerRadius - dist;
              pushLocalX = (diffX / dist) * overlap;
              pushLocalZ = (diffZ / dist) * overlap;
            } else {
              const distLeft = localX - (-col.hw);
              const distRight = col.hw - localX;
              const distTop = localZ - (-col.hd);
              const distBottom = col.hd - localZ;
              const minD = Math.min(distLeft, distRight, distTop, distBottom);
              if (minD === distLeft) pushLocalX = -(distLeft + playerRadius);
              else if (minD === distRight) pushLocalX = (distRight + playerRadius);
              else if (minD === distTop) pushLocalZ = -(distTop + playerRadius);
              else pushLocalZ = (distBottom + playerRadius);
            }

            // Transformada direta correta (local para mundo)
            const worldPushX = pushLocalX * cosA + pushLocalZ * sinA;
            const worldPushZ = -pushLocalX * sinA + pushLocalZ * cosA;
            resX += worldPushX;
            resZ += worldPushZ;
          }
        }
      }
    }

    const maxBound = 74;
    resX = Math.max(-maxBound, Math.min(maxBound, resX));
    resZ = Math.max(-maxBound, Math.min(maxBound, resZ));

    return { x: resX, z: resZ };
  }

  public static resolveWarCollisions(
    px: number,
    pz: number,
    warObstacles: WarObstacle[],
    playerRadius = 0.65
  ): { x: number; z: number } {
    let resX = Math.max(-27 + playerRadius, Math.min(27 - playerRadius, px));
    let resZ = Math.max(-27 + playerRadius, Math.min(27 - playerRadius, pz));

    for (let pass = 0; pass < 2; pass++) {
      for (const obs of warObstacles) {
        const minX = obs.x - obs.hw - playerRadius;
        const maxX = obs.x + obs.hw + playerRadius;
        const minZ = obs.z - obs.hd - playerRadius;
        const maxZ = obs.z + obs.hd + playerRadius;

        if (resX > minX && resX < maxX && resZ > minZ && resZ < maxZ) {
          const dLeft = resX - minX;
          const dRight = maxX - resX;
          const dTop = resZ - minZ;
          const dBottom = maxZ - resZ;
          const minD = Math.min(dLeft, dRight, dTop, dBottom);

          if (minD === dLeft) resX = minX;
          else if (minD === dRight) resX = maxX;
          else if (minD === dTop) resZ = minZ;
          else resZ = maxZ;
        }
      }
    }
    return { x: resX, z: resZ };
  }
}
