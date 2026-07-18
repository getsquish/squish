#!/usr/bin/env bash
set -euo pipefail

script_dir="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
output="$script_dir/sample.mp4"

ffmpeg -hide_banner -loglevel error -y \
  -f lavfi -i "color=c=0x111318:s=1280x720:r=10:d=24" \
  -f lavfi -i "aevalsrc=0.002*sin(2*PI*120*t)+if(between(t\,12.10\,12.35)\,0.32*sin(2*PI*880*t)\,0):s=44100:d=24" \
  -vf "drawgrid=w=160:h=160:t=1:c=0x252A33,drawbox=x=130:y=150:w=300:h=420:c=0x20242C:t=fill,drawbox=x=460:y=150:w=690:h=420:c=0x181B21:t=fill,drawbox=x=1090:y=300:w=70:h=120:c=0xEC4D97:t=fill:enable='between(t,12.40,12.80)'" \
  -c:v libx264 -preset veryslow -crf 30 -pix_fmt yuv420p \
  -c:a aac -b:a 96k -shortest -movflags +faststart \
  "$output"

ffprobe -v error \
  -show_entries format=duration,size \
  -of default=noprint_wrappers=1 \
  "$output"
