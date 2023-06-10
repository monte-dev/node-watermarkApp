const Jimp = require('jimp');
const inquirer = require('inquirer');
const fs = require('fs');

const addTextWatermarkToImage = async function (inputFile, outputFile, text) {
	try {
		const image = await Jimp.read(inputFile);
		const font = await Jimp.loadFont(Jimp.FONT_SANS_64_WHITE);
		const textData = {
			text,
			alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
			alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE,
		};
		image.print(font, 0, 0, textData, image.getWidth(), image.getHeight());
		await image.quality(100).writeAsync(outputFile);
		console.log('Adding watermark has been successful');
		startApp();
	} catch (error) {
		console.error('Something went wrong... Try again!');
	}
};

const addImageWatermarkToImage = async function (
	inputFile,
	outputFile,
	watermarkFile
) {
	try {
		const image = await Jimp.read(inputFile);
		const watermark = await Jimp.read(watermarkFile);

		const x = image.getWidth() / 2 - watermark.getWidth() / 2;
		const y = image.getHeight() / 2 - watermark.getHeight() / 2;

		image.composite(watermark, x, y, {
			mode: Jimp.BLEND_SOURCE_OVER,
			opacitySource: 0.5,
		});
		await image.quality(100).writeAsync(outputFile);
		console.log('Adding watermark has been successful');
		startApp();
	} catch (error) {
		console.error('Something went wrong... Try again!');
	}
};

const addImageModifications = async (mod, inputFile, outputFile) => {
	const image = await Jimp.read(inputFile);

	// image modification option
	if (mod === 'make image brighter') {
		image.brightness(0.5);
		await image.quality(100).writeAsync(outputFile);
	} else if (mod === 'increase contrast') {
		image.contrast(0.2);
		await image.quality(100).writeAsync(outputFile);
	} else if (mod === 'make image b&w') {
		image.greyscale();
		await image.quality(100).writeAsync(outputFile);
	} else if (mod === 'invert image') {
		image.invert();
		await image.quality(100).writeAsync(outputFile);
	} else {
		console.error('Something went wrong... Try again!');
	}

	return image;
};

const prepareOutputFilename = (filename) => {
	const formatted = filename.split('.');
	return `${formatted[0]}-with-watermark.${formatted[1]}`;
};

const startApp = async () => {
	// Ask if user is ready
	const answer = await inquirer.prompt([
		{
			name: 'start',
			message:
				'Hi! Welcome to "Watermark manager". Copy your image files to `/img` folder. Then you\'ll be able to use them in the app. Are you ready?',
			type: 'confirm',
		},
	]);

	// if answer is no, just quit the app
	if (!answer.start) process.exit();

	// ask about input file and watermark type
	const options = await inquirer.prompt([
		{
			name: 'inputImage',
			type: 'input',
			message: 'What file do you want to mark?',
			default: 'test.jpg',
		},
		{
			name: 'imageModifications',
			type: 'list',
			choices: [
				'make image brighter',
				'increase contrast',
				'make image b&w',
				'invert image',
			],
		},
		{
			name: 'watermarkType',
			type: 'list',
			choices: ['Text watermark', 'Image watermark'],
		},
	]);

	const modifiedImage = await addImageModifications(
		options.imageModifications,
		'./img/' + options.inputImage,
		'./img/' + prepareOutputFilename(options.inputImage)
	);

	if (options.watermarkType === 'Text watermark') {
		const text = await inquirer.prompt([
			{
				name: 'value',
				type: 'input',
				message: 'Type your watermark text:',
			},
		]);
		options.watermarkText = text.value;
		if (fs.existsSync(`./img/${options.inputImage}`)) {
			addTextWatermarkToImage(
				modifiedImage,
				'./img/' + prepareOutputFilename(options.inputImage),
				options.watermarkText
			);
		} else {
			console.log('Something went wrong... Try again');
		}
	} else if (options.watermarkType === 'Image watermark') {
		const image = await inquirer.prompt([
			{
				name: 'filename',
				type: 'input',
				message: 'Type your watermark file name:',
				default: 'logo.png',
			},
		]);
		options.watermarkImage = image.filename;
		if (
			fs.existsSync(`./img/${options.inputImage}`) &&
			fs.existsSync(`./img/${options.watermarkImage}`)
		) {
			addImageWatermarkToImage(
				modifiedImage,
				'./img/' + prepareOutputFilename(options.inputImage),
				'./img/' + options.watermarkImage
			);
		} else {
			console.log('Something went wrong... Try again');
		}
	}
};

startApp();
