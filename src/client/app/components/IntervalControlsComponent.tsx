/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as moment from 'moment';
import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import { FormFeedback, FormGroup, Input, Label } from 'reactstrap';
import { useAppDispatch, useAppSelector } from '../redux/reduxHooks';
import { selectChartToRender, graphSlice, selectWidthDays, selectComparePeriod } from '../redux/slices/graphSlice';
import { ChartTypes } from '../types/redux/graph';
import { ComparePeriod } from '../utils/calculateCompare';
import translate from '../utils/translate';
import TooltipMarkerComponent from './TooltipMarkerComponent';

/**
 * @returns interval controls for the bar, map, and compare pages
 */
export default function IntervalControlsComponent() {
	const dispatch = useAppDispatch();
	const chartType = useAppSelector(selectChartToRender);

	// The min/max days allowed for user selection
	const MIN_DAYS = 1;
	const MAX_DAYS = 366;
	// Special value if custom input for standard menu.
	const CUSTOM_INPUT = '-99';

	// This is the current interval for the bar and map graphics.
	const duration = useAppSelector(selectWidthDays);
	// This is the current compare period for graphic
	const comparePeriod = chartType === ChartTypes.compare ? useAppSelector(selectComparePeriod) : undefined;

	// Holds the value of standard duration choices used for bar and map, decoupled from custom.
	const [days, setDays] = React.useState<string>(duration.asDays().toString());
	// Holds the value during custom duration input for bar and map, so only update graphic
	// when done entering and separate from standard choices.
	const [daysCustom, setDaysCustom] = React.useState<number>(duration.asDays());
	// True if custom duration input for bar or map is active.
	const [showCustomDuration, setShowCustomDuration] = React.useState<boolean>(false);

	// Keeps react-level state, and redux state in sync.
	// Two different layers in state may differ especially when externally updated (chart link, history buttons.)
	React.useEffect(() => {
		// Assume value is valid since it is coming from state.
		// Do not allow bad values in state.
		const isCustom = !(['1', '7', '28'].find(days => days == duration.asDays().toString()));
		setShowCustomDuration(isCustom);
		setDaysCustom(duration.asDays());
		setDays(isCustom ? CUSTOM_INPUT : duration.asDays().toString());
	}, [duration]);

	// Returns true if this is a valid duration.
	const daysValid = (days: number) => {
		return Number.isInteger(days) && days >= MIN_DAYS && days <= MAX_DAYS;
	};

	// Updates values when the standard duration menu for bar or map is used.
	const handleDaysChange = (value: string) => {
		if (value === CUSTOM_INPUT) {
			// Set menu value from standard value to special value to show custom
			// and show the custom input area.
			setDays(CUSTOM_INPUT);
			setShowCustomDuration(true);
		} else {
			// Set the standard menu value, hide the custom duration input
			// and duration for graphing.
			// Since controlled values know it is a valid integer.
			setShowCustomDuration(false);
			updateDurationChange(Number(value));
		}
	};

	// Updates value when the custom duration input is used for bar or map.
	const handleCustomDaysChange = (value: number) => {
		setDaysCustom(value);
	};

	const handleEnter = (key: string) => {
		// This detects the enter key and then uses the previously entered custom
		// duration to set the duration for the graphic.
		if (key === 'Enter') {
			updateDurationChange(daysCustom);
		}
	};

	const updateDurationChange = (value: number) => {
		// Update if okay value. May not be okay if this came from user entry in custom form.
		if (daysValid(value)) {
			dispatch(graphSlice.actions.updateDuration(moment.duration(value, 'days')));
		}
	};

	// Define the initial set of options for the dropdown when the chart type is not 'compare'.
	const options = [
		{ label: 'day', value: '1' },
		{ label: 'week', value: '7' },
		{ label: '4.weeks', value: '28' }
	];

	// If the chart type is 'compare', we change the options to reflect comparison periods.
	if (chartType === ChartTypes.compare) {
		options.length = 0; // Clear the previous options
		Object.entries(ComparePeriod).forEach(([key, value]) => {
			options.push({ label: key, value: value.toString() });
		});
	}

	return (
		<div>
			<div style={divTopBottomPadding}>
				<p style={labelStyle}>
					{(chartType === ChartTypes.bar && translate('bar.interval')) ||
						(chartType === ChartTypes.map && translate('map.interval')) ||
						(chartType === ChartTypes.compare && translate('compare.period'))}:
					<TooltipMarkerComponent page='home' helpTextId={
						chartType === ChartTypes.bar ? 'help.home.bar.days.tip' :
							chartType === ChartTypes.map ? 'help.home.map.days.tip' :
								'help.home.compare.period.tip'
					} />
				</p>
				<Input
					id='durationDays'
					name='durationDays'
					type='select'
					value={chartType === ChartTypes.compare ? comparePeriod?.toString() : days}
					onChange={e => handleDaysChange(e.target.value)}
				>
					{options.map(option => (
						<option value={option.value} key={option.label}>
							{translate(option.label)}
						</option>
					))}
					<option value={CUSTOM_INPUT}>
						{translate('custom.value')}
					</option>
				</Input>
				{/* TODO: Compare is currently not ready for a custom option. */}
				{showCustomDuration && chartType !== ChartTypes.compare &&
					<FormGroup>
						<Label for='days'>{translate('bar.days.enter')}:</Label>
						<Input id='days' name='days' type='number'
							onChange={e => handleCustomDaysChange(Number(e.target.value))}
							// This grabs each key hit and then finishes input when hit enter.
							onKeyDown={e => { handleEnter(e.key); }}
							step='1'
							min={MIN_DAYS}
							max={MAX_DAYS}
							value={daysCustom}
							invalid={!daysValid(daysCustom)} />
						<FormFeedback>
							<FormattedMessage id="error.bounds" values={{ min: MIN_DAYS, max: MAX_DAYS }} />
						</FormFeedback>
					</FormGroup>
				}
			</div>
		</div>
	);
}

const divTopBottomPadding: React.CSSProperties = {
	paddingTop: '0px',
	paddingBottom: '15px'
};

const labelStyle: React.CSSProperties = {
	fontWeight: 'bold',
	margin: 0
};
