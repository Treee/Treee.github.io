$(async () => {
    const clientId = 'gct24z0bpt832rurvqgn4m6kqja6kg'
    const defaultImageUrl = 'https://cdn.betterttv.net/emote/5d3c7708c77b14468fe92fc4/2x';

    const emoteConfig = {
        showTwitch: true,
        showBttv: true,
        totalEmotes: 100,
        secondsToRain: 10,
        secondsToWaitForRain: 23,
        channel: 'itsatreee',
        numTimesToRepeat: 1
    };

    console.log('og params', emoteConfig);

    function getPageParams() {
        const params = window.location.search.substring(1).split('&');
        params.forEach((param, index) => {
            const keyValuePair = param.split('=');
            if (!keyValuePair[1]) {
                return;
            }
            else if (keyValuePair[1] === 'true' || keyValuePair[1] === 'false') {
                emoteConfig[keyValuePair[0]] = keyValuePair[1] === 'true';
            } else {
                emoteConfig[keyValuePair[0]] = keyValuePair[1];
            }
        });
    }
    console.log('final params', emoteConfig);

    function addHttpRequestHeaders(xhr) {
        xhr.setRequestHeader('Client-ID', clientId);
        xhr.setRequestHeader('Accept', 'application/vnd.twitchtv.v5+json');
    }

    async function getTwitchEmotes(channelName) {
        return await http(`https://api.twitch.tv/kraken/users?login=${channelName}`, addHttpRequestHeaders).then((data) => {
            // console.log('user', data.users);
            let userId = -9999;
            if (data.users.length > 0) {
                userId = data.users[0]._id;
            }
            return userId
        }).then(async (resolvedUserId) => {
            return await http(`https://api.twitchemotes.com/api/v4/channels/${resolvedUserId}`);
        }).then((data) => {
            // console.log('getTwitchEmotes', data);
            return data.emotes;
        }, errorHandler);
    }

    async function getBttvEmotes(channelName) {
        return await http(`https://api.betterttv.net/2/channels/${channelName}`).then((data) => {
            // console.log('getBttvEmotes', data);
            return data.emotes;
        }, errorHandler);
    }

    const http = (path, beforeSendCallback) => {
        if (!beforeSendCallback) {
            beforeSendCallback = function (xhr) { }
        }
        return $.ajax({
            url: path,
            beforeSend: beforeSendCallback,
            data: {},
            success: (data) => {
                // console.log('success', data);
            },
            dataType: 'json'
        });

    };

    const twitchEmotes = await getTwitchEmotes(emoteConfig.channel);

    const bttvEmotes = await getBttvEmotes(emoteConfig.channel);

    function getRandomTwitchEmote() {
        const randomEmoteIndex = randomNumberBetween(0, twitchEmotes.length - 1);
        const randomEmote = twitchEmotes[randomEmoteIndex];
        const emoteId = randomEmote.id;
        // the default twitch emote sizes are 1.0, 2.0, 3.0
        const emoteSize = `${randomNumberBetween(1, 3)}.0`;
        const emoteUrl = `https://static-cdn.jtvnw.net/emoticons/v1/${emoteId}/${emoteSize}`;
        // we need to map the twitch size to the actual pixel size
        let widthAndHeight = 28;
        if (emoteSize === '2.0') {
            widthAndHeight = 56;
        } else if (emoteSize === '3.0') {
            widthAndHeight = 112;
        }
        return { url: emoteUrl, size: widthAndHeight };
    }

    function getRandomBttvEmote() {
        const randomEmoteIndex = randomNumberBetween(0, bttvEmotes.length - 1);
        const randomEmote = bttvEmotes[randomEmoteIndex];
        const emoteId = randomEmote.id;

        // the default bttv emote sizes are 1x, 2x, 3x
        const emoteSize = `${randomNumberBetween(1, 3)}x`;
        const emoteUrl = `https://cdn.betterttv.net/emote/${emoteId}/${emoteSize}`;
        // we need to map the bttv size to the actual pixel size
        let widthAndHeight = 28;
        if (emoteSize === '2x') {
            widthAndHeight = 56;
        } else if (emoteSize === '3x') {
            widthAndHeight = 112;
        }
        return { url: emoteUrl, size: widthAndHeight };
    }

    function getRandomEmote() {
        const emoteChoices = [];
        const emote = { url: defaultImageUrl, size: 56 };
        if (emoteConfig.showTwitch && twitchEmotes.length > 0) {
            emoteChoices.push(getRandomTwitchEmote());
        }
        if (emoteConfig.showBttv && bttvEmotes.length > 0) {
            emoteChoices.push(getRandomBttvEmote());
        }
        if (emoteChoices.length === 0) {
            emoteChoices.push(emote);
        }
        // pick a random number, if it is even make a twitch emote otherwise bttv emote. toggle
        return emoteChoices[randomNumberBetween(0, emoteChoices.length - 1)];
    }

    function addEmoteToContainer() {
        const randomEmoteImage = getRandomEmote();
        const newEmote = $('<div></div>').addClass('emote');
        newEmote.width(`${randomEmoteImage.size}px`);
        newEmote.height(`${randomEmoteImage.size}px`);
        newEmote.css('background', `url("${randomEmoteImage.url}")`);
        newEmote.css('background-size', 'cover');
        const lifetimeOfElement = randomizeEmoteAnimation(newEmote);
        $('.emote-container').append(newEmote);

        // remove the elment
        setTimeout((emote) => {
            emote.remove();
        }, lifetimeOfElement * 1000, newEmote)
    }

    function randomizeEmoteAnimation(emote) {
        // move across the top of the screen
        emote.css('left', `${randomNumberBetween(0, 93)}vw`);

        // randomize the lifetime of the animation
        let randomAnmimationLifetime = randomNumberBetween(2.5, 8.5);
        emote.css('-webkit-animation', `raining-rotating ${randomAnmimationLifetime}s none linear, fade-out ${randomAnmimationLifetime}s none linear`);

        // return the lifetime of the animation so we can kill it via DOM removal
        return randomAnmimationLifetime;
    }

    function randomNumberBetween(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    getPageParams();

    function errorHandler(error) {
        console.warn('thrown error', error);
    }

    // this first interval makes it so emotes rain immediately instead of waiting for the second interval to start
    let interval = setInterval(addEmoteToContainer, ((emoteConfig.secondsToRain * 1000) / emoteConfig.totalEmotes));

    if (emoteConfig.numTimesToRepeat != -1) {
        // timeout to ensure the raining emotes stop after a certain amount of time
        setTimeout(() => {
            clearInterval(interval);
            emoteConfig.numTimesToRepeat--;
        }, emoteConfig.secondsToRain * 1000);

        // this interval will continually start and stop the raining of emotes.
        setInterval(() => {
            if (emoteConfig.numTimesToRepeat > 0) {
                interval = setInterval(addEmoteToContainer, ((emoteConfig.secondsToRain * 1000) / emoteConfig.totalEmotes));
                setTimeout(() => {
                    clearInterval(interval);
                    emoteConfig.numTimesToRepeat--;
                }, emoteConfig.secondsToRain * 1000);
            }
        }, emoteConfig.secondsToWaitForRain * 1000);
    }

});

