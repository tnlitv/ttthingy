module.exports = (name) => {
    const check = String.prototype.includes.bind(name);
    switch (true) {
        case check('LL'):
            return 'LL h';
        case check('MAT'):
            return 'MAT h';
        case check('meeting'):
            return 'Meeting h';
        default:
            return 'Others h';
    }
};
