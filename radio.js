// Require
const { Client, Intents, VoiceChannel } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const { token, prefix } = require('./config.json');
const play = require('play-dl');
const request = require('request');
const puppeteer = require('puppeteer');
let stream = '';
let playing = false;
let queue = [];
let channel = ''; //channel of user who send
//createAudioResource
const audioPlayer = createAudioPlayer();
// ODkwNjcyOTkxOTEyOTg0Njk2.YUzN3Q.m6oeg-7q7mZDwYITDXxCGCyK3Gc Vojtech
// Promene
const byemsg = 'Čus!';
const help = '!play [songa]\n!leave - Odpoji bota';



async function FindResult(find) {
    const browser = await puppeteer.launch({headless: true})
    const page = await browser.newPage()
    await page.goto(`https://www.youtube.com/results?search_query=${find.join("+")}`)
    // await setTimeout(()=>{ page.evaluate(() =>  document.getElementsByClassName('yt-simple-endpoint style-scope ytd-button-renderer')[9].click()) }, 2500);
    await page.evaluate(() => document.getElementById('thumbnail').click())
    let url = page.url()
    console.log(page.url())
    await browser.close()
    return url
   }


// Create a new client instance
const client = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_VOICE_STATES],
});

audioPlayer.on(AudioPlayerStatus.Idle, async () => {
    if (queue.length != 0) {
        stream = await play.stream(queue[0]);
        resource = createAudioResource(stream.stream, {
            inputType: stream.type,
        });

        audioPlayer.play(resource);
        channel.send(`Přehrávám\n${queue[0]}`)
        queue.shift();
    } else {
        playing = false;
    }
});

audioPlayer.on('error', (error) => {
    console.error(`Error: ${error.message} with resource ${error.resource.metadata.title}`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) {
        if (message.content === byemsg) {
            message.member.voice.disconnect();
            return;
        }
        return;
    }

    if (!message.content.startsWith(prefix)) return;

    // Úprava textu a vytvoření args
    const args = message.content.replace(prefix, '').normalize().trim().replace(/(\s)+/gim, ' ').split(' ');

    switch (args[0].toLowerCase()) {
        case 'play':
            if (message.member.voice.channel) {
                const connection = joinVoiceChannel({
                    channelId: message.member.voice.channel.id,
                    guildId: message.guild.id,
                    adapterCreator: message.guild.voiceAdapterCreator,
                });
                connection.subscribe(audioPlayer);
                channel = message.channel
              
                try {
                    if (args[1].includes('youtube.com')) {
                        if (!playing) {
                            stream = await play.stream(args[1]);
                            resource = createAudioResource(stream.stream, {
                                inputType: stream.type,
                            });

                            audioPlayer.play(resource);
                            playing = true;
                            channel.send(`Přehrávám\n${args[1]}`)
                        } else {
                            queue.push(args[1]);
                            channel.send(`Pozice ve frontě:${queue.length}`)
                        }
                    } else {
                        let geturl = await FindResult(args.slice(0))
                        if (!playing) {
                            stream = await play.stream(geturl);
                            resource = createAudioResource(stream.stream, {
                                inputType: stream.type,
                            });

                            audioPlayer.play(resource);
                            playing = true;
                            channel.send(`Přehrávám\n${geturl}`)
                        } else {
                            queue.push(geturl);
                            channel.send(`Pozice ve frontě:${queue.length}`)
                        }
                    }
                } catch {
                    console.log('NEFUNGUJE TO PICO');
                }
            } else {
                message.reply('Nejsi připojený k Voice channel.');
            }
            break;
        case 'leave':
            message.reply(byemsg);
            break;
        case 'clear':
            audioPlayer.stop();
            queue = [];
            channel.send("Fronta smazána")
            break;
        case 'skip':
            audioPlayer.stop();
            channel.send("Přeskočeno")
            break;
        case 'help':
            message.reply(help);
            break;
        default:
            channel.send(`Příkaz neexistuje :)`)
            break;
    }
});

client.once('ready', async () => {
    console.log('Ready!');
});

// Login to Discord with your client's token
client.login(token);
