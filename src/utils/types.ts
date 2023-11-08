type User = {
	id: number;
	first_name: string;
	last_name: string;
	email: string;
	role: 'standard' | 'admin';
	api_token: string;
};

type ParkingSpot = {
	id: number;
	name: string;
};

interface Booking {
	id: number;
	created_by: User['id'];
	start_datetime: string;
	end_datetime: string;
	parking_spot: ParkingSpot['id'];
	created_at: string;
	updated_at: string;
}

type CreateBookingBody = Pick<Booking, 'start_datetime' | 'end_datetime' | 'parking_spot'>;

interface SimplifiedFullBooking {
    id: number;
    start_datetime: string;
	end_datetime: string;
    spot_name: ParkingSpot['name'];
    user_name: string;
}

export { User, ParkingSpot, Booking, CreateBookingBody, SimplifiedFullBooking };
