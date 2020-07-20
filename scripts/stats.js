const db = require('../db.json');
const sources = ['iana', 'apache', 'nginx', 'mime-support', 'custom'];
console.log('total', Object.values(db).length);
sources.forEach(src => {
  console.log(src, Object.values(db).filter(i => i.source === src).length);
});
console.log(undefined, Object.values(db).filter(i => i === undefined).length);
console.log('other', Object.values(db).filter(i => !sources.includes(i.source)).length);
