#!/bin/bash
# Restart dockerd against the cgroupfs driver.
# runc's systemd driver creates transient units via systemd, which fails inside
# WSL2 because /sys/fs/cgroup is a tmpfs stub rather than the real cgroup2 tree.
# Forcing cgroupfs makes runc write cgroups directly.
pkill dockerd 2>/dev/null
sleep 4
nohup dockerd --exec-opt native.cgroupdriver=cgroupfs > /tmp/dockerd.log 2>&1 &
sleep 14
docker info --format 'driver={{.CgroupDriver}} cgroup={{.CgroupVersion}} storage={{.Driver}}' 2>&1 | head -2