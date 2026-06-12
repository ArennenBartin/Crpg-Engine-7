const fs = require('fs');
let content = fs.readFileSync('src/components/PlayMode.tsx', 'utf8');

content = content.replace(/myEst\.facing = \[eCell\[0\] \- actorCell\[0\], eCell\[1\] \- actorCell\[1\]\];/g, 'myEst.facing = [eCell[0] - actorCell[0], eCell[1] - actorCell[1]] as [number, number];');

fs.writeFileSync('src/components/PlayMode.tsx', content);
