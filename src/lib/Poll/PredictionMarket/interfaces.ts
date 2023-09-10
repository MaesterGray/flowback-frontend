export interface PredictionStatement {
	created_by: {
		group_image: string;
		group_name: string;
		end_date: Date;
		id: number;
		is_admin: boolean;
		permission_id: number;
		permission_name: string;
		user: {
			banner_image: null | string;
			id: number;
			profile_image: null | string;
			username: string;
		};
	};

	description: string;
	id: number;
	prediction_statement_id:number;
	user_prediction_statement_vote_id:number;
	poll_id: number;
	segments: [
		{
			is_true: boolean;
			proposal_description: string;
			proposal_id: number;
			proposal_title: string;
		}
	];
	user_prediction: null | number;
	user_prediction_statement_vote: null | boolean;
}

export interface PredictionBet {
	id: number;
	prediction_statement_id: number;
	created_by: {
		id: number;
		user: {
			id: number;
			username: string;
			profile_image: string;
			banner_image: string;
		};
		is_admin: boolean;
		permission_name: string;
		permission_id: number;
		group_name: string;
		group_image: string;
	};
}
