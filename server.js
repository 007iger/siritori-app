import { serveDir } from "jsr:@std/http/file-server";

let previousWord = "しりとり";

Deno.serve(async (request) => {
    const pathname = new URL(request.url).pathname;

    console.log(`method: ${request.method}`);
    console.log(`pathname: ${pathname}`);

    // GET /shiritori
    if (request.method === "GET" && pathname === "/shiritori") {
        return new Response(previousWord, {
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
            },
        });
    }

    // POST /shiritori
    if (request.method === "POST" && pathname === "/shiritori") {
        const requestJson = await request.json();
        const nextWord = requestJson["nextWord"];

        const previousLastCharacter = previousWord.slice(-1);
        const nextFirstCharacter = nextWord.slice(0, 1);

        if (previousLastCharacter === nextFirstCharacter) {
            previousWord = nextWord;
        } else {
            return new Response(
                JSON.stringify({
                    errorMessage: "前の単語に続いていません",
                    errorCode: "10001",
                }),
                {
                    status: 400,
                    headers: {
                        "Content-Type": "application/json; charset=utf-8",
                    },
                },
            );
        }

        return new Response(previousWord, {
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
            },
        });
    }

    return serveDir(request, {
        fsRoot: "./public/",
        urlRoot: "",
        enableCors: true,
    });
});
