const Project = require('../server/providers/Projects');

function botPromisify(fn, argsObj) {
    return new Promise((resolve, reject) => {
        fn(argsObj, (err, res) => err ? reject(err) : resolve(res));
    });
}

function jsonToValues(json) {
    const out = [];
    let obj = {};
    json.forEach(val => {
        Object.keys(val).forEach(key => {
            const isDesc = key === 'desc';
            obj[isDesc ? 'value': 'title'] = isDesc ?
                `${val[key]}` :
                `${key}: ${val[key]}`;
            if (key === 'desc') {
                out.push(obj);
                obj = {};
            }
        });
    });
    return out;
}

function fieldsToText(fields) {
    const out = fields.map(obj => {
        const title = Object.keys(obj)[0].replace(' h', '');
        return `${title} ${obj[Project(title)]} ${obj.desc}`;
    });
    return out.join('\n');
}

function textToJson(text) {
    try {
        const out = [];
        let obj = {};
        text.split('\n').forEach(val => {
            const [project, hours, ...desc] = val.split(' ');
            obj[Project(project)] = hours;
            obj.desc = desc.join(' ');
            out.push(obj);
            obj = {};
        });
        return out;
    } catch (e) {
        throw new Error('invalid input');
    }
}

function fieldsToJson(fields) {
    const out = [];
    fields.forEach(f => {
        const [key, val] = f.title.split(': ');
        const desc = f.value;
        let obj = {};
        obj[key] = val;
        obj.desc = desc;
        out.push(obj);
    });
    return out;
}

module.exports = {
    botPromisify,
    textToJson,
    jsonToValues,
    fieldsToJson,
    fieldsToText,
};
