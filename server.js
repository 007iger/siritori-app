import { serveDir } from "jsr:@std/http/file-server";

// 使用した単語を保存する配列
let wordHistories = ["しりとり"];

// ゲームが終了しているか
let gameOver = false;

Deno.serve(async (request) => {
    const pathname = new URL(request.url).pathname;

    console.log(`method: ${request.method}`);
    console.log(`pathname: ${pathname}`);

    // GET /shiritori
    // 現在の単語やゲームの状態を返す
    if (request.method === "GET" && pathname === "/shiritori") {
        const previousWord = wordHistories[wordHistories.length - 1];

        return new Response(
            JSON.stringify({
                previousWord: previousWord,
                gameOver: gameOver,
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
        // すでにゲームが終了している場合
        if (gameOver) {
            return new Response(
                JSON.stringify({
                    errorMessage:
                        "ゲームは終了しています。リセットしてください",
                    errorCode: "10004",
                    gameOver: true,
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

        // 入力が空の場合
        if (typeof nextWord !== "string" || nextWord.trim() === "") {
            return new Response(
                JSON.stringify({
                    errorMessage: "単語を入力してください",
                    errorCode: "10000",
                    gameOver: false,
                }),
                {
                    status: 400,
                    headers: {
                        "Content-Type": "application/json; charset=utf-8",
                    },
                },
            );
        }

        // 入力の前後にある空白を削除
        const cleanedNextWord = nextWord.trim();

        // 直前の単語を取得
        const previousWord = wordHistories[wordHistories.length - 1];

        // 直前の単語の最後の文字
        const previousLastCharacter = previousWord.slice(-1);

        // 入力された単語の最初の文字
        const nextFirstCharacter = cleanedNextWord.slice(0, 1);

        // 単語がつながっていない場合
        if (previousLastCharacter !== nextFirstCharacter) {
            return new Response(
                JSON.stringify({
                    errorMessage: "前の単語に続いていません",
                    errorCode: "10001",
                    gameOver: false,
                }),
                {
                    status: 400,
                    headers: {
                        "Content-Type": "application/json; charset=utf-8",
                    },
                },
            );
        }

        // 過去に使用した単語だった場合
        if (wordHistories.includes(cleanedNextWord)) {
            gameOver = true;

            return new Response(
                JSON.stringify({
                    errorMessage:
                        "その単語はすでに使用されています。ゲーム終了です",
                    errorCode: "10003",
                    gameOver: true,
                }),
                {
                    status: 400,
                    headers: {
                        "Content-Type": "application/json; charset=utf-8",
                    },
                },
            );
        }

        // 新しい単語を履歴に追加
        wordHistories.push(cleanedNextWord);

        // 入力された単語が「ん」で終わっている場合
        if (cleanedNextWord.slice(-1) === "ん") {
            gameOver = true;

            return new Response(
                JSON.stringify({
                    errorMessage: "「ん」で終わったため、ゲーム終了です",
                    errorCode: "10002",
                    gameOver: true,
                    previousWord: cleanedNextWord,
                }),
                {
                    status: 400,
                    headers: {
                        "Content-Type": "application/json; charset=utf-8",
                    },
                },
            );
        }

        // 正常に単語が更新された場合
        return new Response(
            JSON.stringify({
                previousWord: cleanedNextWord,
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
    // ゲームを最初からやり直す
    if (request.method === "POST" && pathname === "/reset") {
        wordHistories = ["しりとり"];
        gameOver = false;

        return new Response(
            JSON.stringify({
                previousWord: "しりとり",
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

    // publicフォルダ内のファイルを公開
    return serveDir(request, {
        fsRoot: "./public/",
        urlRoot: "",
        enableCors: true,
    });
});
