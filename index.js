const axios = require('axios');
const { Table } = require('console-table-printer');
const fs = require('fs');
const figlet = require('figlet');
const chalk = require('chalk');
const qs = require('qs');
require('dotenv').config();
const TELEGRAM_ID = process.env.TELEGRAM_ID;
if (!TELEGRAM_ID) {
    console.error(chalk.red('[+] Telegram ID belum disetting'));
    process.exit(0);
}
const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) {
    console.error(chalk.red('[+] Bot Token belum disetting'));
    process.exit(0);
}
const { Telegraf, Markup } = require('telegraf');
const bot = new Telegraf(BOT_TOKEN)

const {
    Twisters,
    LineBuffer,
    terminalSupportsUnicode,
    dots,
    dashes
} = require('twisters'); const twisters = new Twisters({
    spinner: terminalSupportsUnicode() ? dots : dashes,
    flushInactive: true,
    pinActive: false,
    messageDefaults: {
        active: true,
        removed: false,
        render: (message, frame) => {
            const { active, text } = message;
            return active && frame ? `${frame} ${text}` : text;
        }
    },
    buffer: new LineBuffer({
        EOL: '\n',
        disable: !!process.env.CI,
        discardStdin: true,
        handleSigint: true,
        stream: process.stderr,
        truncate: true,
        wordWrap: false
    })
});

function displayAppTitle() {
    console.log('\n' +
        chalk.cyan(figlet.textSync(' AriChain ', { horizontalLayout: 'full' })) +
        '\n' + chalk.dim('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━') +
        '\n' + chalk.gray('By Mamangzed') +
        '\n' + chalk.dim('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
}


async function checkAccount(email) {
    const data = qs.stringify({
        "blockchain": 'testnet',
        "email": email,
        "lang": "id",
        "device": "app",
        "is_mobile": "Y"
    });

    try {
        const response = await axios.post("https://arichain.io/api/wallet/get_list_mobile", data, {
            headers: {
                "Connection": "keep-alive",
                "Accept": "application/json",
                "Accept-Encoding": "gzip",
                "Content-Type": "application/x-www-form-urlencoded; charset=utf-8",
            }
        });

        return {
            error: false,
            data: response.data
        };
    } catch (error) {
        return {
            error: true,
            data: error.response?.data || error.message
        };
    }
}

async function checkIn(address) {
    const data = qs.stringify({
        "blockchain": 'testnet',
        "address": address,
        "lang": "id",
        "device": "app",
        "is_mobile": "Y"
    });

    try {
        const response = await axios.post("https://arichain.io/api/event/checkin", data, {
            headers: {
                "Connection": "keep-alive",
                "Accept": "application/json",
                "Accept-Encoding": "gzip",
                "Content-Type": "application/x-www-form-urlencoded; charset=utf-8",
            }
        });

        return {
            error: false,
            data: response.data
        };
    } catch (error) {
        return {
            error: true,
            data: error.response?.data || error.message
        };
    }
}

async function getQuiz(address) {
    const data = qs.stringify({
        "blockchain": 'testnet',
        "address": address,
        "lang": "id",
        "device": "app",
        "is_mobile": "Y"
    });

    try {
        const response = await axios.post("https://arichain.io/api/event/quiz_q", data, {
            headers: {
                "Connection": "keep-alive",
                "Accept": "application/json",
                "Accept-Encoding": "gzip",
                "Content-Type": "application/x-www-form-urlencoded; charset=utf-8",
            }
        });

        return {
            error: false,
            data: response.data
        };
    } catch (error) {
        return {
            error: true,
            data: error.response?.data || error.message
        };
    }
}

async function answerQuiz(address, quiz_id, answer_id) {
    const data = qs.stringify({
        "blockchain": 'testnet',
        "address": address,
        "quiz_idx": quiz_id,
        "answer_idx": answer_id,
        "lang": "id",
        "device": "app",
        "is_mobile": "Y"
    });

    try {
        const response = await axios.post("https://arichain.io/api/event/quiz_a", data, {
            headers: {
                "Connection": "keep-alive",
                "Accept": "application/json",
                "Accept-Encoding": "gzip",
                "Content-Type": "application/x-www-form-urlencoded; charset=utf-8",
            }
        });

        return {
            error: false,
            data: response.data
        };
    } catch (error) {
        return {
            error: true,
            data: error.response?.data || error.message
        };
    }
}

function cilukBa(email) {
    if (!email.includes("@")) return email;

    let [local, domain] = email.split("@");

    if (local.length <= 6) {
        return local.charAt(0) + "***@" + domain;
    }

    let firstThree = local.substring(0, 3);
    let lastThree = local.substring(local.length - 3);
    let censored = firstThree + "***" + lastThree + "@" + domain;

    return censored;
}

function bakekok(address) {
    let firstThree = address.substring(0, 3);
    let lastThree = address.substring(address.length - 5);
    let censored = firstThree + "***" + lastThree;
    return censored;
}
async function readAccounts(filePath = 'accounts.json') {
    try {
        const data = await fs.promises.readFile(filePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error("Gagal membaca file JSON:", error);
        return null;
    }
}


async function updateTableData(sendKuis = true, accounts, quiz_id = null, answer_id = null) {
    let success = false;
    let tableData = [];

    while (!success) {
        try {
            let sendQuiz = true;
            tableData = await Promise.all(accounts.map(async (account, index) => {
                let akun = await checkAccount(account.email);
                if (!akun?.data?.result || !Array.isArray(akun.data.result) || akun.data.result.length === 0) {
                    throw new Error("Akun tidak ditemukan, mengulang proses...");
                }
                const cekin = await checkIn(akun?.data?.result[0]?.account);

                if (sendQuiz && sendKuis) {
                    const cekQuid = await getQuiz(akun?.data?.result[0]?.account);
                    sendQuiz = false;
                    const quizText = cekQuid.data.result.quiz_title;
                    let quizAn = cekQuid.data.result.quiz_q.map((val) => ({
                        text: val.question,
                        answer: `answer_${cekQuid.data.result.quiz_idx}_${val.q_idx}`
                    }));
                    await sendButtons(quizText, quizAn);
                }

                let quiz = null;
                if (quiz_id !== null && answer_id !== null) {
                    quiz = await answerQuiz(akun?.data?.result[0]?.account, quiz_id, answer_id);
                }
                akun = await checkAccount(account.email);
                if (!akun?.data?.result || !Array.isArray(akun.data.result) || akun.data.result.length === 0) {
                    throw new Error("Akun tidak ditemukan, mengulang proses...");
                }
                const statusQuiz = quiz?.data?.result?.msg
                    ? `✔️  ${quiz.data.result.msg}`
                    : `🔄 Menunggu jawaban kuis`;

                return {
                    No: index + 1,
                    Email: cilukBa(account?.email ?? "N/A"),
                    Address: bakekok(akun?.data?.result[0]?.account) ?? "Unknown",
                    Tokenname: akun?.data?.result[0]?.balance_type ?? "-",
                    Balance: akun?.data?.result[0]?.amount ?? "-",
                    quiz: statusQuiz,
                    checkIn: cekin?.data?.status !== 'fail' ? "🟢 Checked in today" : `✔️  ${cekin?.data?.msg}`
                };
            }));

            success = true;
        } catch (err) {
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
    }

    return tableData;
}


function renderTable(data) {
    return new Promise((resolve) => {
        const table = new Table({
            columns: [
                { name: "No", alignment: "center", title: "No" },
                { name: "Email", alignment: "left", title: "Email" },
                { name: "Address", alignment: "left", title: "Address", color: "yellow" },
                { name: "Tokenname", alignment: "center", title: "Nama Token" },
                { name: "Balance", alignment: "left", title: "Balance", color: "green" },
                { name: "quiz", alignment: "left", title: "Daily Quiz", minWidth: 20, maxWidth: 30, wrapWord: true },
                { name: "checkIn", alignment: "left", title: "Check-In Harian", minWidth: 20, maxWidth: 30, wrapWord: true },
            ],
        });

        table.addRows(data);
        resolve(table.render());
    });
}

function getCurrentTime() {
    const now = new Date();
    return now.toLocaleTimeString("id-ID", { hour12: false });
}

async function countdown(seconds, processId) {
    for (let i = seconds; i > 0; i--) {
        const hours = String(Math.floor(i / 3600)).padStart(2, "0");
        const minutes = String(Math.floor((i % 3600) / 60)).padStart(2, "0");
        const seconds = String(i % 60).padStart(2, "0");

        twisters.put(processId, { text: `⏳ Menunggu: ${hours}:${minutes}:${seconds} (Saat ini: ${getCurrentTime()})` });
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}

async function main() {
    const tableId = "TableId";
    const processId = "ProcessId";
    displayAppTitle()

    try {
        while (true) {
            twisters.put(processId, { text: "🔄 Checking in..." });
            const accounts = await readAccounts();
            const updatedTable = await updateTableData(true, accounts);
            const renderedTable = await renderTable(updatedTable);

            twisters.put(tableId, { text: renderedTable });
            updatedTable.forEach(row => {
                row.Balance = row.Balance;
                row.Tokenname = row.Tokenname;
                row.checkIn = row.checkIn;
                row.quiz = row.quiz
            });

            const newRenderedTable = await renderTable(updatedTable);
            twisters.put(tableId, { text: newRenderedTable, active: false });
            twisters.put(processId, { text: "✅ Table update completed!\n" + renderedTable });
            await countdown(24 * 60 * 60, processId);
        }

    } catch (error) {
        console.error("Terjadi kesalahan:", error);
        twisters.put(processId, { text: "❌ Error: " + error });
    }
}
main();

function createButton(choices) {
    return Markup.inlineKeyboard(
        choices.map(choice => [Markup.button.callback(choice.text, choice.answer)])
    );
};

async function sendButtons(message = "Pilih jawaban Anda:", choices) {
    try {
        await bot.telegram.sendMessage(TELEGRAM_ID, message, createButton(choices));
    } catch (error) {
        console.error("❌ Gagal mengirim pesan:", error);
    }
}



bot.on("callback_query", async (ctx) => {
    const answerId = ctx.callbackQuery.data;
    const choice = answerId;
    if (choice) {
        const jawaban = choice.split('_')
        const getAccount = await readAccounts();
        const updatedTable = await updateTableData(false, getAccount, jawaban[1], jawaban[2])
        const renderedTable = await renderTable(updatedTable);

        twisters.put(`TableId`, { text: renderedTable, active: false });

        ctx.answerCbQuery();
        ctx.reply(`✅ Jawaban berhasil dikirim`);
    } else {
        ctx.answerCbQuery("Pilihan tidak valid!");
    }
});
bot.launch();
console.log("🤖 Bot sedang berjalan...");
