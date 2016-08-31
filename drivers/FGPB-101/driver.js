"use strict";

const path			= require('path');
const ZwaveDriver	= require('homey-zwavedriver');

// http://manuals.fibaro.com/content/manuals/en/FGPB-101/FGPB-101-EN-T-v1.0.pdf

module.exports = new ZwaveDriver( path.basename(__dirname), {
	capabilities: {
		'measure_battery': {
			'command_class'				: 'COMMAND_CLASS_BATTERY',
			'command_get'				: 'BATTERY_GET',
			'command_report'			: 'BATTERY_REPORT',
			'command_report_parser'		: function( report ) {
				if( report['Battery Level'] === "battery low warning" ) {
					return 1;
				}
				return report['Battery Level (Raw)'][0];
			}
		}
	}
});

module.exports.on('initNode', function( token ){
	var node = module.exports.nodes[ token ];
	if( node ) {
		node.instance.CommandClass['COMMAND_CLASS_CENTRAL_SCENE'].on('report', function( command, report ){
			if( command.name === 'CENTRAL_SCENE_NOTIFICATION' ) {
				var button_value = {
					"scene": report.Properties1['Key Attributes'].toString()
				};
				Homey.manager('flow').triggerDevice('FGPB-101', null, button_value, node.device_data);
			}
		});
	}
});
Homey.manager('flow').on('trigger.FGPB-101', function( callback, args, state ) {
	if(state.scene === args.scene) {
		callback(null, true);
		return;
	}
	callback(null, false);
});
