function isWeekday(year, month, day) {
    var day = new Date(year, month, day).getDay();
    return day !=0 && day !=6;
}

function getWorkingDaysArray() {
    const [year, month, days] = [
        new Date().getFullYear(),
        new Date().getMonth(),
        new Date(new Date().getFullYear(), new Date().getMonth(), 0).getDate()
    ];
    const out = [];
    for (let i = 1; i <= days; i++) {
        if (isWeekday(year, month, i)) out.push(i);
    }
    return out;
}

module.exports = {
    getWorkingDaysArray,
};
