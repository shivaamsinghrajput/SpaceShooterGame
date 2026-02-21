const cvs = document.getElementById("cvs");
const ctx = cvs.getContext("2d");
const scoreEL = document.getElementById("scoreEL");
const levelEL = document.getElementById("levelEL");
const DISelements = document.getElementsByClassName("DIS");
const levelDisEL = document.getElementById("levelDIS");
const scoreDisEL = document.getElementById("scoreDIS");
const initBTN = document.getElementById("initBTN");
const rootElement = document.documentElement;

let gamePROP = {
  score: 0,
  level: 0,
  levelUPemoji: ["🥳", "🎊", "👏", "🎉", "😊", "🤩", "😎", "🎯"],
  overEmoji: ["❤️‍🩹", "X", "💀", "😥"],
  overLines: [
    "Better Luck Next Time.",
    "Game Over. Try Again?",
    "You Almost Had It!",
    "So Close… Yet So Far.",
    "Defeat Today, Victory Tomorrow.",
    "That Looked Expensive.",
    "Oof. That Must’ve Hurt.",
    "You Fought Well, Hero.",
    // "Respawn and Redeem Yourself.",
    "The End… For Now.",
    "Press Retry to Rewrite History.",
    "Mission Failed. We'll Get 'Em Next Time.",
    "Your Journey Ends Here.",
    "Skill Issue? 😉",
    "One More Round?",
  ],
  sounds:{
    kill: new Audio("./assets/kill.wav"),
    over:new Audio("./assets/explosion.mp3"),
    hit:new Audio("./assets/hit.wav"),
    levelup:new Audio("./assets/levelup.mp3")
  },
  br2: "<br><br>",
  scoreINC: {
    hit: 5,
    kill: 10,
  },
  levelGap: {
    currCumulate: 0,
    nxt: 100,
  },
  isDISon: false,
  DIS: {
    style0: DISelements[0].style,
    style1: DISelements[1].style,
    startOpacityVal: 0.8,
    OpacityDec: 0.982, // multiply method
  },
};
const defNxtLevelGap = gamePROP.levelGap.nxt;

const style0 = gamePROP.DIS.style0;
const style1 = gamePROP.DIS.style1;

style0.opacity = "0";
style1.opacity = "0";

let opacity = 0.1;

let particlePROP = {
  friction: 0.991,
  countFACTOR: 1, // will decide no. of particles at explosion
  alphaDECREASE: 0.01,
  vf: {
    min: 2.6,
    max: 7.9,
  },
};

let playerPROP = {
  radius: {
    dynemic: true,
    min: 20,
    max: 57,
    change: .3,
    // static mode
    hitInc: 0,
    killInc: 0,
  },
};

let projectilePROP = {
  damage: {
    min: 13,
    max: 37,
  },
  playerProjectileRadiiRatio: 2.89,
  vf: {
    min: 4.9,
    max: 12.2,
  },
};

let enemyPROP = {
  radius: {
    min: 9.1,
    max: 75,
  },
  spawn: {
    interval: 2750,
    defInterval: 2750, //both must be same
    minInterval: 200,
    difficultyINC: 0.9999,
    killDiffINC: 0.987,
  },
  velocityFACTOR: .9,
  defVelocityFACTOR: .9, //both must be same
  velocityFactorInc: 1.001,
  killVelocityFactorInc: 1.007,
  vfMax: 4.9,
};

cvs.width = innerWidth;
cvs.height = innerHeight;

class Player {
  constructor(x, y, radius, color) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.expanding = true;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    ctx.fillStyle = this.color;
    ctx.fill();
  }
  changeRadius(radii) {
    if (this.radius > radii.max || this.radius < radii.min) {
      this.expanding = !this.expanding;
    }

    if (this.expanding) {
      this.radius += radii.change;
    } else {
      this.radius -= radii.change;
    }
  }
}

class Projectile {
  constructor(x, y, radius, color, velocity, vf) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.velocity = velocity;
    this.vf = vf;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    ctx.fillStyle = this.color;
    ctx.fill();
  }

  update() {
    this.draw();
    this.x += this.velocity.x;
    this.y += this.velocity.y;
  }
}

class Enemy {
  constructor(x, y, radius, color, velocity, vf) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.velocity = velocity;
    this.vf = vf;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    ctx.fillStyle = this.color;
    ctx.fill();
  }

  update() {
    this.draw();
    this.x += this.velocity.x;
    this.y += this.velocity.y;
  }
}

class Particle {
  constructor(x, y, radius, color, velocity) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.velocity = velocity;
    this.alpha = 1;
  }

  draw() {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.restore();
  }

  update() {
    this.draw();
    this.velocity.x *= particlePROP.friction;
    this.velocity.y *= particlePROP.friction;
    this.x += this.velocity.x;
    this.y += this.velocity.y;
    this.alpha -= particlePROP.alphaDECREASE;
  }
}

let player = new Player(
  cvs.width / 2,
  cvs.height / 2,
  playerPROP.radius.min,
  "white",
);
player.draw();

let projectiles = [];
let enemies = [];
let particles = [];

let animationID;
function animate() {
  animationID = requestAnimationFrame(animate);

  const opacity0 = Number(style0.opacity);
  const opacity1 = Number(style1.opacity);
  if (gamePROP.isDISon) {
    style0.opacity = `${opacity0 * gamePROP.DIS.OpacityDec}`;
    style1.opacity = `${opacity1 * gamePROP.DIS.OpacityDec}`;
  }
  if (opacity0 <= 0 || opacity1 <= 0) {
    gamePROP.isDISon = false;
  }

  ctx.fillStyle = `rgba(0,0,0,${opacity})`;
  ctx.fillRect(0, 0, cvs.width, cvs.height);

  if (playerPROP.radius.dynemic) {
    player.changeRadius(playerPROP.radius);
  }
  // player.radius+=5
  player.draw();

  // draw projectiles
  projectiles.forEach((projectile, id) => {
    projectile.update();

    if (
      projectile.x <= projectile.radius ||
      projectile.x + projectile.radius >= cvs.width ||
      projectile.y <= projectile.radius ||
      projectile.y + projectile.radius >= cvs.height
    ) {
      projectiles.splice(id, 1);
    }
  });

  // draw enemies
  enemies.forEach((enemy, eIndex) => {
    enemy.update();

    // enemy player hit
    const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
    if (dist <= player.radius + enemy.radius + 1) {
      gameOver();
    }

    // enemy projectile hit
    projectiles.forEach((projectile, pIndex) => {
      const dist = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y);
      if (dist < enemy.radius + projectile.radius) {
        // console.log(projectile.vf);
        // console.log(enemy.vf);

        collLEVEL = collisionLevel(projectile.vf, enemy.radius);

        min = particlePROP.vf.min;
        max = particlePROP.vf.max;

        vf = min + (max - min) * collLEVEL;
        // vf = projectile.vf + enemy.vf; // ~7 is a good vf
        // console.log(vf);

        // explosion/particles creation
        for (let i = 0; i < enemy.radius * particlePROP.countFACTOR; i++) {
          particles.push(
            new Particle(
              projectile.x,
              projectile.y,
              Math.random() * Math.max(enemy.radius * 0.05, 0.4),
              enemy.color,
              {
                y: (Math.random() - 0.5) * (Math.random() * vf),
                x: (Math.random() - 0.5) * (Math.random() * vf),
              },
            ),
          );
        }

        // damage
        dyn = playerPROP.radius.dynemic;
        if (dyn) {
          dMIN = projectilePROP.damage.min;
          dMAX = projectilePROP.damage.max;

          radiFRAC = getProjectileRadiusFRAC(projectile.radius);
          damage = dMIN + (dMAX - dMIN) * radiFRAC;
        } else {
          damage = Math.max(5, player.radius - 20);
        }
        if (enemy.radius - damage >= enemyPROP.radius.min) {
          // update/increase score @hit/srinkage of enemy
          if (!dyn) {
            player.radius += playerPROP.radius.hitInc;
          }
          updateScore(gamePROP.scoreINC.hit);
          gamePROP.sounds.hit.play()

          
          gsap.to(enemy, {
            radius: enemy.radius - damage,
          });
          setTimeout(() => {
            projectiles.splice(pIndex, 1);
          }, 0);
        } else {
          // update/increase score @kill/removeal of enemy
          incDifficulty((kill = true));
          updateScore(gamePROP.scoreINC.kill);
          gamePROP.sounds.kill.play()

          setTimeout(() => {
            enemies.splice(eIndex, 1);
            projectiles.splice(pIndex, 1);
          }, 0);
        }
      }
    });
  });

  // draw particles
  particles.forEach((particle, index) => {
    if (particle.alpha <= 0) {
      particles.splice(index, 1);
    } else {
      particle.update();
    }
  });
}

function getProjectileRadiusFRAC(pRadius) {
  rMIN = playerPROP.radius.min;
  rMAX = playerPROP.radius.max;

  radiFRAC =
    (pRadius * projectilePROP.playerProjectileRadiiRatio - rMIN) /
    (rMAX - rMIN);

  return radiFRAC;
}

function updateScore(inc) {
  gamePROP.score += inc;
  scoreEL.innerHTML = gamePROP.score;

  if (
    gamePROP.score >=
    gamePROP.levelGap.currCumulate + gamePROP.levelGap.nxt
  ) {
    gamePROP.level += 1;
    gamePROP.sounds.levelup.play()
    levelEL.innerHTML = gamePROP.level;
    gamePROP.levelGap.currCumulate += gamePROP.levelGap.nxt;

    showDIS();
    // DISelements.forEach((elem)=>{
    // console.log("oanrst");
    // })
  }
}

function showDIS() {
  style0.opacity = `${gamePROP.DIS.startOpacityVal}`;
  style1.opacity = `${gamePROP.DIS.startOpacityVal}`;

  const br2 = gamePROP.br2;
  emote =
    gamePROP.levelUPemoji[
      Math.floor(Math.random() * gamePROP.levelUPemoji.length)
    ];
  levelDisEL.innerHTML = `${emote} Level ${gamePROP.level} reached<br>${br2}`;
  scoreDisEL.innerHTML = `${br2 + br2}Score ${gamePROP.score}`;

  gamePROP.isDISon = true;
}
function collisionLevel(pVF, eRADIUS) {
  min = 0.25 * projectilePROP.vf.min + 0.75 * enemyPROP.radius.min;
  max = 0.25 * projectilePROP.vf.max + 0.75 * enemyPROP.radius.max;
  current = pVF + eRADIUS;

  collLEVEL = (current - min) / (max - min);
  return collLEVEL;
}

function incDifficulty(kill = false) {
  let spawn = enemyPROP.spawn;
  dyn = playerPROP.radius.dynemic;

  if (!kill) {
    // decreaseing enemy spawn interval
    spawn.interval *= spawn.difficultyINC;

    // increasing enemy velocity
    enemyPROP.velocityFACTOR *= enemyPROP.velocityFactorInc;
  } else {
    spawn.interval *= spawn.killDiffINC;
    enemyPROP.velocityFACTOR *= enemyPROP.killVelocityFactorInc;
    if (!dyn) {
      player.radius += playerPROP.radius.killInc;
    }
  }

  if (spawn.interval <= spawn.minInterval) {
    spawn.interval = spawn.minInterval;
  }

  if (enemyPROP.velocityFACTOR >= enemyPROP.vfMax) {
    enemyPROP.velocityFACTOR = enemyPROP.vfMax;
  }
}

function createEnemy() {
  const radius =
    Math.random() * (enemyPROP.radius.max - enemyPROP.radius.min) +
    enemyPROP.radius.min;
  let x;
  let y;

  if (Math.random() < 0.5) {
    x = Math.random() * cvs.width;
    y = Math.random() < 0.5 ? 0 - radius : cvs.height + radius;
  } else {
    y = Math.random() * cvs.height;
    x = Math.random() < 0.5 ? 0 - radius : cvs.width + radius;
  }

  const angle = Math.atan2(player.y - y, player.x - x);
  vfrangeMIN = Math.max(enemyPROP.velocityFACTOR - 0.5, 1);
  let vf = Math.random() * (enemyPROP.velocityFACTOR - vfrangeMIN) + vfrangeMIN; // *(radius*.05)
  const velocity = {
    x: Math.cos(angle) * vf,
    y: Math.sin(angle) * vf,
  };
  enemies.push(
    new Enemy(
      x,
      y,
      radius,
      `hsl(${Math.random() * 360}, 50%,50%)`,
      velocity,
      vf,
    ),
  );
}

function spawnEnemies() {
  createEnemy();
  let spawn = enemyPROP.spawn;

  // spawn.interval *= spawn.difficultyINC;
  // if (spawn.interval <= spawn.minInterval) {
  //   spawn.interval = spawn.minInterval;
  // }

  // increasing the difficulty as game continues
  incDifficulty();

  setTimeout(spawnEnemies, spawn.interval);
}

function init() {
  projectiles = [];
  enemies = [];
  particles = [];
  enemyPROP.spawn.interval = enemyPROP.spawn.defInterval;
  enemyPROP.velocityFACTOR = enemyPROP.defVelocityFACTOR;
  gamePROP.score = 0;
  gamePROP.level = 0;
  gamePROP.levelGap.currCumulate = 0;
  gamePROP.levelGap.nxt = defNxtLevelGap;
  levelEL.innerHTML = 0;
  scoreEL.innerHTML = 0;
  style0.opacity = 0;
  style1.opacity = 0;

  let player = new Player(cvs.width / 2, cvs.height / 2, 30, "white");
  player.draw();
  animate();
  // style0.color="#fff" //`#c20202`
  // style0.fontSize=

  rootElement.style.setProperty("--lFontSize", "100px");
  rootElement.style.setProperty("--lColor", "#fff");

  rootElement.style.setProperty("--sColor", "#3bff25");

  initBTN.style.display = "none";

  console.log("init");
  removeEventListener("keydown", init);
  removeEventListener("mouseup", init);
}

function gameOver() {
  cancelAnimationFrame(animationID);
  gamePROP.sounds.over.play()
  // alert(`Game Over @SCORE: ${gamePROP.score} press OK to RESTART`);
  br2 = gamePROP.br2;
  const emote =
    gamePROP.overEmoji[Math.floor(Math.random() * gamePROP.overEmoji.length)];

  const line =
    gamePROP.overLines[Math.floor(Math.random() * gamePROP.overLines.length)];
  invisibleTXT = "‎ ‎ ‎ ";

  levelDisEL.innerHTML = `${emote} 𝔾𝔸𝕄𝔼 𝕆𝕍𝔼ℝ${invisibleTXT}<br>${invisibleTXT}👉  𝕃𝕖𝕧𝕖𝕝: ${gamePROP.level}<br>${invisibleTXT}👉  𝕊𝕔𝕠𝕣𝕖: ${gamePROP.score}<br>${br2}`;
  scoreDisEL.innerHTML = `${br2 + br2}${line}`;
  style0.opacity = 1;
  style1.opacity = 1;

  // style0.fontSize = `45px`;
  // style0.color="#f00" //`#c20202`
  rootElement.style.setProperty("--lFontSize", "42px");
  rootElement.style.setProperty("--lColor", "#f00");
  rootElement.style.setProperty("--sColor", "#fff");

  initBTN.style.display = "";

  addEventListener("keydown", init);
  // addEventListener("mouseup", init);
}

addEventListener("mousedown", (e) => {
  let projRADIUS = player.radius / projectilePROP.playerProjectileRadiiRatio;

  const angle = Math.atan2(e.clientY - player.y, e.clientX - player.x);

  vfMIN = projectilePROP.vf.min;
  vfMAX = projectilePROP.vf.max;
  radiFRAC = getProjectileRadiusFRAC(projRADIUS);

  vf = vfMIN + (vfMAX - vfMIN) * (1 - radiFRAC);
  const velocity = {
    x: Math.cos(angle) * vf,
    y: Math.sin(angle) * vf,
  };

  projectiles.push(
    new Projectile(player.x, player.y, projRADIUS, "white", velocity, vf),
  );
});

initBTN.onclick = init;

// addEventListener("keydown", (e) => {
//   if (e.key == "Control") {
//     dyn = playerPROP.radius.dynemic;
//     playerPROP.radius.dynemic = !dyn;
//     console.log(`dyn ${!dyn}`);
//   }
// });

animate();
spawnEnemies();
