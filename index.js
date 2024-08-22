export const generateCanvas = ({ width, height, attachNode }) => {
  const element = document.createElement("canvas");
  const context = element.getContext("2d");

  element.style.width = width + "px";
  element.style.height = height + "px";

  const scale = window.devicePixelRatio;
  element.width = Math.floor(width * scale);
  element.height = Math.floor(height * scale);
  context.scale(scale, scale);

  document.querySelector(attachNode).appendChild(element);

  return [context, width, height, element];
};

export const animate = (drawFunc) => {
  let previousTimestamp = false;

  const drawFuncContainer = (timestamp) => {
    const deltaTime = previousTimestamp
      ? timestamp - previousTimestamp
      : performance.now() - timestamp;
    drawFunc(deltaTime);
    window.requestAnimationFrame(drawFuncContainer);
    previousTimestamp = timestamp;
  };

  window.requestAnimationFrame(drawFuncContainer);
};

export const randomBetween = (min, max) => Math.random() * (max - min) + min;

const pink = "#e79fae";
const red = "#da4b34";
const yellow = "#f5c347";
const turquoise = "#8bcbf3";
const white = "#fbfbf8";

const [CTX, canvasWidth, canvasHeight] = generateCanvas({
  width: window.innerWidth,
  height: window.innerHeight,
  attachNode: "#canvas",
});

const makeBall = ({ startPosition, startVelocity, radius }) => {
  const gravity = 0.1;
  const position = { ...startPosition };
  const velocity = { ...startVelocity };
  const color = [pink, red, yellow, turquoise, white][
    Math.floor(Math.random() * 5)
  ];

  const update = () => {
    position.x += velocity.x;
    position.y += velocity.y;
    velocity.y += gravity;

    if (position.x > canvasWidth - radius) {
      position.x = canvasWidth - radius;
      velocity.x *= -1;
    } else if (position.x < radius) {
      position.x = radius;
      velocity.x *= -1;
    }
    if (position.y > canvasHeight - radius) {
      position.y = canvasHeight - radius;
      velocity.y *= -0.7;
    } else if (position.y < radius) {
      position.y = radius + 1;
      velocity.y *= -0.7;
    }
  };

  const draw = () => {
    CTX.fillStyle = color;
    CTX.beginPath();
    CTX.arc(position.x, position.y, radius, 0, 2 * Math.PI);
    CTX.fill();
  };

  return {
    update,
    draw,
    getPosition: () => position,
    getVelocity: () => velocity,
  };
};

function Ball(x, y, dx, dy, r) {
  const grav = [0, -0.1];
  this.x = x;
  this.y = y;
  this.dx = dx;
  this.dy = dy;
  this.r = r;
  this.color = [pink, red, yellow, turquoise, white][
    Math.floor(Math.random() * 5)
  ];

  this.draw = function () {
    CTX.fillStyle = this.color;
    CTX.beginPath();
    CTX.arc(this.x, this.y, this.r, 0, 2 * Math.PI);
    CTX.fill();
  };

  this.update = function () {
    this.x += this.dx;
    this.y += this.dy;
    this.dx += grav[0];
    this.dy -= grav[1];
    if (this.x > canvasWidth - this.r) {
      this.x = canvasWidth - this.r;
      this.dx *= -1;
    } else if (this.x < this.r) {
      this.x = this.r;
      this.dx *= -1;
    }
    if (this.y > canvasHeight - this.r) {
      this.y = canvasHeight - this.r;
      this.dy *= -0.7;
    } else if (this.y < this.r) {
      this.y = this.r + 1;
      this.dy *= -0.7;
    }
    this.draw();
  };
}

const balls = new Array(9)
  .fill()
  .map(
    () =>
      new Ball(
        randomBetween(canvasWidth / 8, canvasWidth - canvasWidth / 8),
        randomBetween(canvasHeight / 8, canvasHeight - canvasHeight / 8),
        randomBetween(-3, 3),
        randomBetween(-4, -2),
        Math.min(canvasHeight, canvasWidth) / 16
      )
  );

animate(() => {
  CTX.clearRect(0, 0, canvasWidth, canvasHeight);

  balls.forEach((ballA) => {
    ballA.update();
    balls.forEach((ballB) => {
      if (ballA !== ballB) {
        const collision = checkCollision(ballA, ballB);
        if (collision[0]) {
          adjustPositions(ballA, ballB, collision[1]);
          resolveCollision(ballA, ballB);
        }
      }
    });
  });
});

function checkCollision(ballA, ballB) {
  const rSum = ballA.r + ballB.r;
  const dx = ballB.x - ballA.x;
  const dy = ballB.y - ballA.y;
  return [rSum * rSum > dx * dx + dy * dy, rSum - Math.sqrt(dx * dx + dy * dy)];
}

function resolveCollision(ballA, ballB) {
  const relVel = [ballB.dx - ballA.dx, ballB.dy - ballA.dy];
  let norm = [ballB.x - ballA.x, ballB.y - ballA.y];
  const mag = Math.sqrt(norm[0] * norm[0] + norm[1] * norm[1]);
  norm = [norm[0] / mag, norm[1] / mag];

  const velAlongNorm = relVel[0] * norm[0] + relVel[1] * norm[1];
  if (velAlongNorm > 0) return;

  const bounce = 0.7;
  let j = -(1 + bounce) * velAlongNorm;
  j /= 1 / ballA.r + 1 / ballB.r;

  const impulse = [j * norm[0], j * norm[1]];
  ballA.dx -= (1 / ballA.r) * impulse[0];
  ballA.dy -= (1 / ballA.r) * impulse[1];
  ballB.dx += (1 / ballB.r) * impulse[0];
  ballB.dy += (1 / ballB.r) * impulse[1];
}

function adjustPositions(ballA, ballB, depth) {
  //Inefficient implementation for now
  const percent = 0.2;
  const slop = 0.01;
  let correction =
    (Math.max(depth - slop, 0) / (1 / ballA.r + 1 / ballB.r)) * percent;

  let norm = [ballB.x - ballA.x, ballB.y - ballA.y];
  const mag = Math.sqrt(norm[0] * norm[0] + norm[1] * norm[1]);
  norm = [norm[0] / mag, norm[1] / mag];
  correction = [correction * norm[0], correction * norm[1]];
  ballA.x -= (1 / ballA.r) * correction[0];
  ballA.y -= (1 / ballA.r) * correction[1];
  ballB.x += (1 / ballB.r) * correction[0];
  ballB.y += (1 / ballB.r) * correction[1];
}
