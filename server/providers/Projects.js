module.exports = (name) => {
    const check = String.prototype.includes.bind(name.toLowerCase());
    switch (true) {
        case check('ll'):
            return 'LL h';
        case check('mat'):
            return 'MAT h';
        case check('meeting'):
            return 'Meeting h';
        default:
            return 'Others h';
    }
};
