export class Mutex {
    private mutex = Promise.resolve();

    lock(): Promise<() => void> {
        return new Promise((resolve) => {
            this.mutex = this.mutex.then(() => new Promise(resolve));
        });
    }

    async runExclusive<T>(fn: () => Promise<T> | T): Promise<T> {
        const release = await this.lock();
        try {
            return await fn();
        } finally {
            release();
        }
    }
}
