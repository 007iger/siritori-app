import { serveDir } from "jsr:@std/http/file-server";

// 最初の単語候補
const startWords = [
    "しりとり",
    "りんご",
    "ごりら",
    "らっぱ",
    "ぱんだ",
    "だるま",
];

// 最初の単語をランダムに選ぶ
function getRandomStartWord() {
    const randomIndex = Math.floor(Math.random() * startWords.length);
    return startWords[randomIndex];
}

// 使用した単語の履歴
let wordHistories = [getRandomStartWord()];

// ゲームが終了しているか
let gameOver = false;

Deno.serve(async (request) => {
    const pathname = new URL(request.url).pathname;

    console.log(`method: ${request.method}`);
    console.log(`pathname: ${pathname}`);

    // GET /shiritori
    // 現在の単語、履歴、ゲーム状態を返す
    if (request.method === "GET" && pathname === "/shiritori") {
        const previousWord = wordHistories[wordHistories.length - 1];

        return new Response(
            JSON.stringify({
                previousWord,
                wordHistories,
                gameOver,
            }),
            {
                headers: {
                    "Content-Type": "application/json; charset=utf-8",
                },
            },
        );
    }

    // POST /shiritori
    // 入力された単語を確認する
    if (request.method === "POST" && pathname === "/shiritori") {
        if (gameOver) {
            return new Response(
                JSON.stringify({
                    errorMessage:
                        "ゲームは終了しています。リセットしてください",
                    errorCode: "10004",
                    gameOver: true,
                    wordHistories,
                }),
                {
                    status: 400,
                    headers: {
                        "Content-Type": "application/json; charset=utf-8",
                    },
                },
            );
        }

        const requestJson = await request.json();
        const nextWord = requestJson["nextWord"];

        // 空欄チェック
        if (typeof nextWord !== "string" || nextWord.trim() === "") {
            return new Response(
                JSON.stringify({
                    errorMessage: "単語を入力してください",
                    errorCode: "10000",
                    gameOver: false,
                    wordHistories,
                }),
                {
                    status: 400,
                    headers: {
                        "Content-Type": "application/json; charset=utf-8",
                    },
                },
            );
        }

        const cleanedNextWord = nextWord.trim();
        const previousWord = wordHistories[wordHistories.length - 1];

        const previousLastCharacter = previousWord.slice(-1);
        const nextFirstCharacter = cleanedNextWord.slice(0, 1);

        // 単語がつながっていない
        if (previousLastCharacter !== nextFirstCharacter) {
            return new Response(
                JSON.stringify({
                    errorMessage: "前の単語に続いていません",
                    errorCode: "10001",
                    gameOver: false,
                    wordHistories,
                }),
                {
                    status: 400,
                    headers: {
                        "Content-Type": "application/json; charset=utf-8",
                    },
                },
            );
        }

        // 過去に使った単語
        if (wordHistories.includes(cleanedNextWord)) {
            gameOver = true;

            return new Response(
                JSON.stringify({
                    errorMessage:
                        "その単語はすでに使用されています。ゲーム終了です",
                    errorCode: "10003",
                    gameOver: true,
                    previousWord,
                    wordHistories,
                }),
                {
                    status: 400,
                    headers: {
                        "Content-Type": "application/json; charset=utf-8",
                    },
                },
            );
        }

        // 履歴に追加
        wordHistories.push(cleanedNextWord);

        // 「ん」で終了
        if (cleanedNextWord.slice(-1) === "ん") {
            gameOver = true;

            return new Response(
                JSON.stringify({
                    errorMessage: "「ん」で終わったため、ゲーム終了です",
                    errorCode: "10002",
                    gameOver: true,
                    previousWord: cleanedNextWord,
                    wordHistories,
                }),
                {
                    status: 400,
                    headers: {
                        "Content-Type": "application/json; charset=utf-8",
                    },
                },
            );
        }

        // 正常に更新
        return new Response(
            JSON.stringify({
                previousWord: cleanedNextWord,
                wordHistories,
                gameOver: false,
            }),
            {
                status: 200,
                headers: {
                    "Content-Type": "application/json; charset=utf-8",
                },
            },
        );
    }

    // POST /reset
    // ランダムな単語で最初からやり直す
    if (request.method === "POST" && pathname === "/reset") {
        const newStartWord = getRandomStartWord();

        wordHistories = [newStartWord];
        gameOver = false;

        return new Response(
            JSON.stringify({
                previousWord: newStartWord,
                wordHistories,
                gameOver: false,
            }),
            {
                status: 200,
                headers: {
                    "Content-Type": "application/json; charset=utf-8",
                },
            },
        );
    }

    // publicフォルダを公開
    return serveDir(request, {
        fsRoot: "./public/",
        urlRoot: "",
        enableCors: true,
    });
});
