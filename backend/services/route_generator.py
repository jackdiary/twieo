import osmnx as ox
import networkx as nx
import os
import folium
import random
import math
import time
from geopy.distance import distance as geopy_distance
from geopy.point import Point

# Enable OSMnx caching
ox.settings.use_cache = True
ox.settings.log_console = True

def get_graph(lat, lon, dist_km=3.0):
    """
    Download graph centered at (lat, lon) with a given radius.
    """
    print(f"Downloading graph for point ({lat}, {lon}) with radius {dist_km}km...")
    start_time = time.time()
    # dist is in meters
    G = ox.graph_from_point((lat, lon), dist=dist_km*1000, network_type='walk')
    end_time = time.time()
    print(f"Graph download/load took: {end_time - start_time:.2f} seconds")
    return G

def calculate_destination(lat, lon, distance_km, bearing_degrees):
    """
    Calculate a destination point given start point, distance, and bearing.
    """
    start = Point(lat, lon)
    d = geopy_distance(kilometers=distance_km)
    destination = d.destination(point=start, bearing=bearing_degrees)
    return destination.latitude, destination.longitude

def generate_multiple_routes(lat, lon, target_distance_km, preference="none", count=3):
    """
    Generate multiple route alternatives with different starting bearings.
    Returns a list of routes with their characteristics.
    """
    routes = []
    bearings = [0, 120, 240]  # Different starting directions for variety
    
    for i, base_bearing in enumerate(bearings[:count]):
        route_id = chr(65 + i)  # A, B, C
        route = generate_circular_route(lat, lon, target_distance_km, preference, fixed_bearing=base_bearing)
        
        if route:
            # Analyze route characteristics
            features = analyze_route_features(route)
            routes.append({
                "id": route_id,
                "route": route,
                "features": features
            })
    
    return routes

def analyze_route_features(route):
    """
    Analyze route characteristics (placeholder for now)
    """
    return {
        "points": len(route),
        "estimated_time": len(route) * 0.1  # Rough estimate
    }

def generate_circular_route(lat, lon, target_distance_km, preference="none", fixed_bearing=None):
    """
    Generate a circular route using a triangle heuristic.
    Start -> A -> B -> Start
    """
    print(f"Generating course for ({lat}, {lon}) with distance {target_distance_km}km...")
    
    # Optimize: Download graph with smaller radius. 
    # For a circular route of length L, the diameter is roughly L/pi. 
    # A radius of L/2 is safe enough.
    radius_km = (target_distance_km / 2.0) + 0.2
    
    graph_start_time = time.time()
    G = get_graph(lat, lon, dist_km=radius_km)
    print(f"Total graph preparation took: {time.time() - graph_start_time:.2f} seconds")
    
    # Find nearest node to start
    start_node = ox.distance.nearest_nodes(G, lon, lat)
    print(f"Graph nodes: {len(G.nodes)}, edges: {len(G.edges)}")
    print(f"Start node: {start_node}")
    
    # Heuristic: Triangle with side length = target_distance / 3
    side_length = target_distance_km / 3.0
    
    # Random or fixed initial bearing
    if fixed_bearing is not None:
        bearing = fixed_bearing
    else:
        bearing = random.uniform(0, 360)
    
    # Point A
    lat_a, lon_a = calculate_destination(lat, lon, side_length, bearing)
    node_a = ox.distance.nearest_nodes(G, lon_a, lat_a)
    print(f"Node A: {node_a} ({lat_a}, {lon_a})")
    
    # Point B (turn 120 degrees)
    lat_b, lon_b = calculate_destination(lat_a, lon_a, side_length, (bearing + 120) % 360)
    node_b = ox.distance.nearest_nodes(G, lon_b, lat_b)
    print(f"Node B: {node_b} ({lat_b}, {lon_b})")
    
    # Calculate paths with preference-based weighting
    if preference == "scenic":
        # Apply scenic weighting
        G_weighted = apply_scenic_weights(G)
        weight = 'weighted_length'
    elif preference == "quiet":
        # Apply quiet weighting
        G_weighted = apply_quiet_weights(G)
        weight = 'weighted_length'
    else:
        G_weighted = G
        weight = 'length'
    
    try:
        path1 = nx.shortest_path(G_weighted, start_node, node_a, weight=weight)
        path2 = nx.shortest_path(G_weighted, node_a, node_b, weight=weight)
        path3 = nx.shortest_path(G_weighted, node_b, start_node, weight=weight)
        print("Paths found successfully.")
        
        # Combine paths (remove duplicate nodes at join points)
        full_path_nodes = path1 + path2[1:] + path3[1:]
        
        # Convert node IDs to coordinates
        route_coords = []
        for node_id in full_path_nodes:
            route_coords.append({
                "latitude": G.nodes[node_id]['y'],
                "longitude": G.nodes[node_id]['x']
            })
            
        return route_coords
    except nx.NetworkXNoPath:
        print("No path found between waypoints.")
        return []

def apply_scenic_weights(G):
    """
    Apply weighting for scenic routes.
    Prefer: waterways, parks, natural areas
    """
    G_weighted = G.copy()
    
    for u, v, key, data in G_weighted.edges(keys=True, data=True):
        base_length = data.get('length', 100)
        weight = base_length
        
        # Get edge attributes
        highway = data.get('highway', '')
        waterway = data.get('waterway', '')
        leisure = data.get('leisure', '')
        natural = data.get('natural', '')
        
        # Prefer waterways (rivers, streams)
        if waterway in ['river', 'stream', 'canal']:
            weight *= 0.5  # Strong preference
        
        # Prefer parks
        if leisure == 'park':
            weight *= 0.5
        
        # Prefer natural areas
        if natural in ['wood', 'forest', 'tree_row']:
            weight *= 0.6
        
        # Slightly prefer pedestrian paths
        if highway in ['footway', 'path', 'pedestrian']:
            weight *= 0.8
        
        G_weighted[u][v][key]['weighted_length'] = weight
    
    return G_weighted

def apply_quiet_weights(G):
    """
    Apply weighting for quiet routes.
    Avoid: main roads, commercial areas
    """
    G_weighted = G.copy()
    
    for u, v, key, data in G_weighted.edges(keys=True, data=True):
        base_length = data.get('length', 100)
        weight = base_length
        
        # Get edge attributes
        highway = data.get('highway', '')
        landuse = data.get('landuse', '')
        
        # Avoid main roads
        if highway == 'primary':
            weight *= 2.0  # Strong penalty
        elif highway == 'secondary':
            weight *= 1.5  # Medium penalty
        elif highway == 'tertiary':
            weight *= 1.2  # Light penalty
        
        # Avoid commercial areas
        if landuse in ['commercial', 'retail']:
            weight *= 1.8
        
        # Prefer residential and pedestrian areas
        if highway in ['footway', 'path', 'pedestrian', 'residential']:
            weight *= 0.7
        
        G_weighted[u][v][key]['weighted_length'] = weight
    
    return G_weighted

def visualize_route(G, route, output_file="route_map.html"):
    """
    Visualize the route on a map.
    """
    if not route:
        print("Empty route, nothing to visualize.")
        return

    print(f"Visualizing route to {output_file}...")
    m = ox.plot_route_folium(G, route, weight=5, color="blue")
    m.save(output_file)
    print("Done.")

if __name__ == "__main__":
    # Test
    # Seoul City Hall: 37.5665, 126.9780
    # Mapo-gu center approx: 37.556, 126.905
    test_lat, test_lon = 37.556, 126.905
    
    # Use dynamic graph generation in test
    G = get_graph(test_lat, test_lon, 4.0)
    
    route = generate_circular_route(test_lat, test_lon, 3.0, "scenic")
    visualize_route(G, route)
