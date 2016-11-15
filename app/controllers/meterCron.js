const cron = require('node-cron');
const Meter = require('./../../models/Meter');
const Reading = require('./../../models/Reading');
const readMamacData = require('./readMamacData');

function updateAllMeters() {
	Meter.getAll()
		.then(meters => {
			return meters.map(meter => {
				return readMamacData(meter).then(Reading.insertOrUpdateAll);
			});
		})
		.then(promises => Promise.all(promises))
		.then(() => console.log("Update finished"))
		.catch(console.error);
}

// Runs every hour, five minutes after. (ie 23:05, 00:05, ...)
cron.schedule('0 5 * * * *', () => {
	let time = new Date;
	console.log("getting meter data " + time.getHours() + ":" + time.getMinutes() + ":" + time.getSeconds());
	updateAllMeters();
});
