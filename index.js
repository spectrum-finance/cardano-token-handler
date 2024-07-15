const config = require('./config');
const fs = require("fs");
const path = require("path");

const handleDir = ({src, mapper, verified}) => {
    try {
        return fs.readdirSync(path.join(__dirname, src)).map((fileName) => {
            try {
                const file = fs.readFileSync(path.join(__dirname, `${src}/${fileName}`));
                const {info, img} = mapper(JSON.parse(file.toString()));
                return {info: {...info, verified}, img};
            } catch (e) {
              console.warn(e);
              return undefined;
            }
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
            hash[item.info.subject] = {
                info: { ...item.info, ...hash[item.info.subject].info },
                img: hash[item.info.subject].img
            };
        } else {
            hash[item.info.subject] = item;
        }
    });

    return Object.values(hash);
}

const tokensInfo = sortList(uniq(config.paths.flatMap(configItem => handleDir(configItem).filter(Boolean)))
    .map(({info, img}) => {
        let filePath;
        let url;
        if (img) {
            if (img.type === 'buffer') {
                filePath = `./out/logos/${info.subject}.webp`;
                url = `/logos/cardano/${info.subject}.webp`;
                fs.writeFileSync(path.join(__dirname, filePath), img.content);
            } else {
                if (img.content.startsWith('http')) {
                    url = img.content
                } else {
                    const [fileName] = img.content.split('/').reverse();
                    filePath = `./out/logos/${fileName}`;
                    url = `/logos/cardano/${fileName}`;
                    try {
                        fs.writeFileSync(path.join(__dirname, filePath), fs.readFileSync(path.join(__dirname, img.content)));
                    } catch (e) {
                        console.log(e);
                        console.log(`no icon for ${JSON.stringify(info)}`)
                    }
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
    tokens: tokensInfo,
}

const tokenListV2 = {
    name: "Spectrum Finance Cardano Token List",
    timestamp: new Date().toISOString(),
    version: config.paths.map(c => c.version).join('--'),
    tags: {},
    keywords: ["spectrum finance", "tokens", "cardano tokens"],
    tokens: tokensInfo.reduce((acc, asset) => ({
        ...acc,
        [asset.subject
            ? [
                asset.subject.slice(0, 56),
                asset.subject.slice(56, asset.subject.length),
            ].join('.')
            : '.']: {
            ...asset,
            logo: asset.logo && !asset.logo?.startsWith('http') ?
                `https://spectrum.fi${asset.logo}` :
                asset.logo,
        }
    }), {}),
}

fs.writeFile(path.join(__dirname, './out/cardano-token-list.json'), JSON.stringify(tokenList, null, 2), 'utf8', function (err) {
    if (err) {
        console.log("An error occured while writing JSON Object to File. ");
        return console.log(err);
    }

    console.log("New cardano token list has been built.");
    console.log("Current version is " + tokenList.version + ".");
})

fs.writeFile(path.join(__dirname, './out/cardano-token-list-v2.json'), JSON.stringify(tokenListV2, null, 2), 'utf8', function (err) {
    if (err) {
        console.log("An error occured while writing JSON Object to File. ");
        return console.log(err);
    }

    console.log("New cardano token list v2 has been built.");
    console.log("Current version is " + tokenList.version + ".");
})
