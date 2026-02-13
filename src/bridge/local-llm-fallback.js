class LocalLLMFallback {
    constructor() {}

    // Basic deterministic reply: STOP to finish the crawl gracefully
    async requestApi(prompt) {
        return 'STOP';
    }

    async requestApiStateless(prompt) {
        // For task-generation, return an empty list to avoid creating tasks
        return '';
    }
}

module.exports = LocalLLMFallback;
