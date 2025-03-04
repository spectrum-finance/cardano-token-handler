const config = require('./config');
const fs = require("fs");
const path = require("path");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
require("dotenv").config();

const s3adapter = new S3Client({
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY,
        secretAccessKey: process.env.R2_SECRET_KEY,
    },
    region: "auto"
})

const uploadToCDN = async (key, data, contentType) => {
    try{
        const params = new PutObjectCommand({
            Bucket: 'tokens',
            Key: key,
            Body: data,
            ContentType: contentType,
            ACL: "public-read",
        });
        await s3adapter.send(params);
        console.log(`Uploaded: ${key}`);
        return `https://tokens.splash.trade/${key}`
    } catch (error){
        console.error(`Upload error for ${key}:`, error)
        return null
    }
}
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
        let fileName
        if (img) {
            if (img.type === 'buffer') {
                fileName = `${info.subject}.webp`
                url = `https://tokens.splash.trade/logos/${fileName}`;
                uploadToCDN(`logos/${fileName}`, img.content, "image/webp").catch(console.error);
            } else {
                if (img.content.startsWith('http')) {
                    url = img.content
                } else {
                    const [fileName] = img.content.split('/').reverse();
                    filePath = `./out/logos/${fileName}`;
                    url = `https://tokens.splash.trade/logos/${fileName}`;
                    try {
                        const fileContent = fs.readFileSync(path.join(__dirname, img.content));
                        uploadToCDN(`logos/${fileName}`, img.content, "image/webp").catch(console.error);
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

const tokenListSnekfun = {
    name: "Spectrum Finance Cardano Token List",
    timestamp: new Date().toISOString(),
    version: config.paths.map(c => c.version).join('--'),
    tags: {},
    keywords: ["snekfun", "tokens", "cardano tokens"],
    tokens: tokensInfo.filter(asset => asset.snekFun || !asset.subject).reduce((acc, asset) => ({
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

fs.writeFile(path.join(__dirname, './out/cardano-token-list-snekfun.json'), JSON.stringify(tokenListSnekfun, null, 2), 'utf8', function (err) {
    if (err) {
        console.log("An error occured while writing JSON Object to File. ");
        return console.log(err);
    }

    console.log("New cardano token list snekfun has been built.");
    console.log("Current version is " + tokenList.version + ".");
})

try {
    tokenList
        .tokens
        .forEach(asset => fs.writeFileSync(`./out/metadata/${asset.subject ? [
            asset.subject.slice(0, 56),
            asset.subject.slice(56, asset.subject.length),
        ].join('.') : 'ada'}.json`, JSON.stringify({
            ...asset,
            logo: asset.logo && !asset.logo?.startsWith('http') ?
                `https://spectrum.fi${asset.logo}` :
                asset.logo,
        })))

    console.log('separated assets generated');
} catch (e) {
    console.log(e);
}
const processTokensUpload = async () => {
    try {
        await Promise.all(
            tokenList.tokens.map(async (asset) => {
                const fileName = asset.subject
                    ? `${asset.subject.slice(0, 56)}${asset.subject.length > 56 ? "." + asset.subject.slice(56) : ""}.json`
                    : "ada.json";

                const jsonContent = JSON.stringify(asset);

                await uploadToCDN(fileName, jsonContent, 'application/json');
            })
        );

        console.log("assets were uploaded to cdn");
    } catch (e) {
        console.error("error during uploading json to cdn", e);
    }
};

processTokensUpload()
