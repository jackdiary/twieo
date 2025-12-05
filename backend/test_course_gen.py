
import sys
import os

# Add current directory to path to import services
sys.path.append(os.getcwd())

try:
    from services.route_generator import generate_multiple_routes
    print("Successfully imported generate_multiple_routes")
except ImportError as e:
    print(f"Failed to import generate_multiple_routes: {e}")
    sys.exit(1)

def test_generation():
    # Seoul City Hall coordinates
    lat = 37.5665
    lon = 126.9780
    distance = 3.0 # 3km
    preference = "none"

    print(f"Testing route generation for Lat: {lat}, Lon: {lon}, Dist: {distance}km")
    
    try:
        routes = generate_multiple_routes(lat, lon, distance, preference, count=1)
        if routes:
            print(f"Success! Generated {len(routes)} routes.")
            for i, route in enumerate(routes):
                print(f"Route {i+1} points: {len(route['route'])}")
        else:
            print("No routes generated (returned empty list).")
    except Exception as e:
        print(f"Error during generation: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_generation()
