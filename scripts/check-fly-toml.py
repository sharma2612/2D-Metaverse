import tomllib

with open('/mnt/c/Users/sumit/projec/2d-metaverse/fly.toml', 'rb') as f:
    d = tomllib.load(f)

print('fly.toml parses OK')
print('app          :', d['app'])
print('region       :', d['primary_region'])
print('dockerfile   :', d['build']['dockerfile'])
print('internal_port:', d['http_service']['internal_port'])
print('force_https  :', d['http_service']['force_https'])
print('concurrency  :', d['http_service']['concurrency'])
print('memory       :', d['vm'][0]['memory'])
print('health path  :', d['http_service']['checks'][0]['path'])
print('grace period :', d['http_service']['checks'][0]['grace_period'])