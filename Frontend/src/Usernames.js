let names = [
  'Eagle', 'Vulture', 'Shark', 'Fox', 'Tiger', 'Lion', 'Sparrow', 'Falcon',
  'Wolf', 'Direwolf', 'Penguin', 'Rabbit', 'Ant', 'Centipede', 'Coala', 'Dolphin',
  'Emu', 'Goose', 'Hare', 'Jaguar', 'Cheetah', 'Leopard', 'Raccoon', 'Ostrich'
]
exports.nameFun = () => {
  return names[Math.floor(Math.random() * names.length)];
}