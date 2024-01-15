const config = require('./config');
const fs = require("fs");
const path = require("path");

const handleDir = ({src, mapper, verified}) => {
    try {
        return fs.readdirSync(path.join(__dirname, src)).map((fileName) => {
            const file = fs.readFileSync(path.join(__dirname, `${src}/${fileName}`));
            const {info, img} = mapper(JSON.parse(file.toString()));
            return {info: {...info, verified}, img};
        });
    } catch (e) {
        console.warn(e)
        return [];
    }
}

function sortList(list) {
    return list.sort(function (t1, t2) {
        if (t1.ticker && t2.ticker) {
            return t1.ticker.toLowerCase() < t2.ticker.toLowerCase() ? -1 : 1;
        }

        return true;
    });
}

const uniq = (items) => {
    const hash = {};

    items.forEach(item => {
        if (hash[item.info.subject]) {
            return;
        }
        hash[item.info.subject] = item;
    });

    return Object.values(hash);
}

const tokensInfo = sortList(uniq(config.paths.flatMap(handleDir))
    .map(({info, img}) => {
        let filePath;
        let url;
        if (img) {
            if (img.type === 'buffer') {
                filePath = `./out/logos/${info.subject}.webp`;
                url = `/cardano/logos/${info.subject}.webp`;
                fs.writeFileSync(path.join(__dirname, filePath), img.content);
            } else {
                const [fileName] = img.content.split('/').reverse();
                filePath = `./out/logos/${fileName}`;
                url = `/cardano/logos/${fileName}`;
                try {
                    fs.writeFileSync(path.join(__dirname, filePath), fs.readFileSync(path.join(__dirname, img.content)));
                } catch (e) {
                    console.log(e);
                    console.log(`no icon for ${JSON.stringify(info)}`)
                }
            }
        }
        return url ? {...info, logo: url} : info;
    }));

const tokenList = {
    name: "Spectrum Finance Cardano Token List",
    timestamp: new Date().toISOString(),
    version: config.paths.map(c => c.version).join('--'),
    tags: {},
    keywords: ["spectrum finance", "tokens", "cardano tokens"],
    tokens: tokensInfo
}

fs.writeFile(path.join(__dirname, './out/cardano-token-list.json'), JSON.stringify(tokenList, null, 2), 'utf8', function (err) {
    if (err) {
        console.log("An error occured while writing JSON Object to File. ");
        return console.log(err);
    }

    console.log("New cardano token list has been built.");
    console.log("Current version is " + tokenList.version + ".");
})
