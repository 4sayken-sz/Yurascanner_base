const https = require('https');

class GeminiBridge {
    constructor(apiKey, model = 'chat-bison-001') {
        this.apiKey = apiKey;
        this.model = model;
    }

    async requestApi(messages) {
        const last = messages.slice(-1)[0];
        const prompt = last && last.content ? last.content : '';
        return await this._callGenerate(prompt);
    }

    async requestApiStateless(prompt) {
        return await this._callGenerate(prompt);
    }

    _callGenerate(prompt) {
        // Use chat-style messages expected by chat-bison
        const body = JSON.stringify({
            messages: [
                { author: 'user', content: { text: prompt } }
            ],
            temperature: 0.2
        });

        const options = {
            hostname: 'generativelanguage.googleapis.com',
            path: `/v1beta2/models/${this.model}:generate?key=${this.apiKey}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body)
            }
        };

        return new Promise((resolve, reject) => {
            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => (data += chunk));
                res.on('end', () => {
                    try {
                        const parsed = JSON.parse(data);
                        // Try common response shapes
                        if (parsed.candidates && parsed.candidates.length > 0) {
                            const cand = parsed.candidates[0];
                            if (cand.content && cand.content.length > 0 && cand.content[0].text) {
                                return resolve(cand.content[0].text);
                            }
                            if (cand.output) return resolve(cand.output);
                            if (cand.message && cand.message.content && cand.message.content.text) return resolve(cand.message.content.text);
                        }
                        if (parsed.output && parsed.output[0] && parsed.output[0].content && parsed.output[0].content[0] && parsed.output[0].content[0].text) {
                            return resolve(parsed.output[0].content[0].text);
                        }
                        // Fallback to stringified response
                        resolve(JSON.stringify(parsed));
                    } catch (e) {
                        reject(e);
                    }
                });
            });

            req.on('error', (e) => reject(e));
            req.write(body);
            req.end();
        });
    }
}

module.exports = GeminiBridge;
