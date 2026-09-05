export default function makeArrRequest(baseUrl: string, apiKey: string) {
    return async function arrRequest<T>(endpoint: string, init?: RequestInit): Promise<T> {
        const response = await fetch(baseUrl + '/' + endpoint, {
            ...init,
            headers: new Headers({
                "X-Api-Key": apiKey,
                "Content-Type": "application/json",
                "Accept": "application/json, text/plain",
            }),
        });

        // DELETE/PUT can respond with an empty body
        const text = await response.text();

        return (text ? JSON.parse(text) : undefined) as T;
    };
}
