const Jimp = require('jimp');
const chalk = require('chalk');
const path = require('path');
const fs = require('fs');
const { program } = require('commander');

// Define chalk color
const errorColor = chalk.bold.red;

// Define Jimp colors
const JimpColors = {
    RED: Jimp.rgbaToInt(255, 0, 0, 255),
    BLUE: Jimp.rgbaToInt(0, 0, 255, 255)
};

class ScreenshotModule {
    constructor(pageWrapper) {
        // Check whether screenshots were enabled
        if (!program.opts().screenshot) {
            return;
        }

        this.page = pageWrapper.getPageObj();
        this.pageWrapper = pageWrapper;

        // ✅ Windows-safe timestamp (NO : or .)
        const timestamp = new Date()
            .toISOString()
            .replace(/[:.]/g, '-');

        // ✅ Proper screenshots directory
        this.screenshotDir = path.resolve(
            __dirname,
            '../../output/screenshots',
            timestamp
        );

        // ✅ Recursive mkdir (no ENOENT)
        fs.mkdirSync(this.screenshotDir, { recursive: true });
    }

    async takeElementScreenshot(elem, text, filename) {
        if (!program.opts().screenshot) return;

        await elem.scrollIntoView();
        let boundingRect = await this.#getBoundingClientRect(elem);

        let screenshotFilepath = await this.#takeScreenshot(filename);
        await this.#highlightScreenshot(
            screenshotFilepath,
            [boundingRect],
            JimpColors.RED,
            text
        );
    }

    async takeFormScreenshot(form, text, filename) {
        if (!program.opts().screenshot) return;

        let boundingRects = [];
        let formElems = await this.pageWrapper.getFormElements(form);

        for (let elem of formElems) {
            boundingRects.push(await this.#getBoundingClientRect(elem));
        }

        let screenshotFilepath = await this.#takeScreenshot(filename);
        await this.#highlightScreenshot(
            screenshotFilepath,
            boundingRects,
            JimpColors.BLUE,
            text
        );
    }

    async takeStopScreenshot(text, filename) {
        if (!program.opts().screenshot) return;

        let screenshotFilepath = await this.#takeScreenshot(filename);
        let image = await Jimp.read(screenshotFilepath);

        let screenshotRect = {
            x: 0,
            y: 0,
            width: image.bitmap.width,
            height: image.bitmap.height
        };

        await this.#highlightScreenshot(
            screenshotFilepath,
            [screenshotRect],
            JimpColors.RED,
            text
        );
    }

    async #takeScreenshot(filename) {
        // ✅ Safe filename fallback
        const safeFilename =
            filename?.replace(/[<>:"/\\|?*]/g, '_') || 'screenshot.png';

        let screenshotFilepath = path.join(this.screenshotDir, safeFilename);
        await this.page.screenshot({ path: screenshotFilepath });
        return screenshotFilepath;
    }

    async #highlightScreenshot(screenshotFilepath, boundingRects, color, text) {
        let image = await Jimp.read(screenshotFilepath);

        for (let rect of boundingRects) {
            await this.#drawRectangle(image, rect, color);
        }

        await this.#addTextToImage(image, text);
        await image.writeAsync(screenshotFilepath);
    }

    async #addTextToImage(image, text) {
        try {
            let font = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);
            await image.print(
                font,
                0,
                20,
                {
                    text: text || '',
                    alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER
                },
                image.bitmap.width,
                image.bitmap.height
            );
        } catch (e) {
            console.log(
                errorColor('[!] Error occurred when printing task with Jimp:\n'),
                e
            );
        }
    }

    async #getBoundingClientRect(elem) {
        return await elem.evaluate((el) => {
            let { x, y, width, height } = el.getBoundingClientRect();
            return { x, y, width, height };
        });
    }

    async #drawRectangle(image, boundingRect, color) {
        try {
            const { x, y, width, height } = boundingRect;
            const borderWidth = 3;

            for (let currX = x; currX < x + width; currX++) {
                for (let currY = y; currY < y + height; currY++) {
                    if (
                        currX < x + borderWidth ||
                        currX >= x + width - borderWidth ||
                        currY < y + borderWidth ||
                        currY >= y + height - borderWidth
                    ) {
                        image.setPixelColor(color, currX, currY);
                    }
                }
            }
        } catch (error) {
            console.log(
                errorColor('[!] Error occurred while drawing rectangle with Jimp:'),
                error
            );
        }
    }
}

module.exports = ScreenshotModule;
