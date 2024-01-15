const path = require("path");

module.exports = {
    paths: [{
        src: './sources/cardano-token-registry/mappings',
        verified: true,
        version: 1,
        mapper: (json) => {
            const token = {};

            if (json.subject) {
                token.policyId = json.subject.slice(0, 56);
                token.subject = json.subject;
            } else {
                return;
            }

            if (!json.decimals) {
                token.decimals = 0;
            } else {
                token.decimals = json.decimals.value;
            }

            if (!json.ticker) {
                token.ticker = ''
            } else {
                token.ticker = json.ticker.value.trim();
            }

            if (!json.description) {
                token.description = ''
            } else {
                token.description = json.description.value.trim();
            }

            if (!json.name) {
                token.name = ''
            } else {
                token.name = json.name.value.trim();
            }

            if (json.url && json.url.value) {
                token.url = json.url.value.trim();
            } else {
                token.url = ''
            }

            let buffer;
            if (json.logo && json.logo.value && json.subject) {
                const byteString = json.logo.value

                buffer = Buffer.from(byteString, 'base64');
            }

            return {
                info: token,
                img: buffer ? {
                    content: buffer,
                    type: 'buffer'
                } : undefined
            }
        }
    }, {
        src: './sources/cardano-tokens/mappings',
        verified: false,
        version: 2,
        mapper: (json) => {
            const jsonCopy = Object.assign({}, json);
            delete jsonCopy['logo'];
            return {
                info: {
                    ...jsonCopy
                },
                img: json.logo && json.logo.type === 'url' ? {
                    content: path.join('./sources/cardano-tokens/images', json.logo.content)
                } : json.logo
            }
        }
    }]
}
