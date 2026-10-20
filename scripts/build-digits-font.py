# coding: utf-8
"""Build original five-column display numerals; fontTools is a development-only dependency."""
from pathlib import Path
import json
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.ttLib import TTFont
ROOT=Path(__file__).resolve().parents[1]
patterns={
'0':['01110','10001','10011','10101','11001','10001','01110'],
'1':['00100','01100','00100','00100','00100','00100','01110'],
'2':['01110','10001','00001','00110','01000','10000','11111'],
'3':['11110','00001','00001','01110','00001','00001','11110'],
'4':['00010','00110','01010','10010','11111','00010','00010'],
'5':['11111','10000','10000','11110','00001','00001','11110'],
'6':['01110','10000','10000','11110','10001','10001','01110'],
'7':['11111','00001','00010','00100','01000','01000','01000'],
'8':['01110','10001','10001','01110','10001','10001','01110'],
'9':['01110','10001','10001','01111','00001','00001','01110']}
glyphs={}
for char,rows in patterns.items():
 rects=[]
 for col in range(5):
  start=None
  for row in range(8):
   active=row<7 and rows[row][col]=='1'
   if active and start is None:start=row
   if not active and start is not None:
    rects.append([36+108*col,756-108*row,72,108*(row-start)]);start=None
 glyphs[char]={'advance':576,'rects':rects}
glyphs.update({'.':{'advance':216,'rects':[[72,0,72,108]]},',':{'advance':216,'rects':[[72,0,72,108],[36,-108,72,108]]},':':{'advance':216,'rects':[[72,162,72,108],[72,486,72,108]]},'-':{'advance':432,'rects':[[36,324,72,108],[144,324,72,108],[252,324,72,108]]},'—':{'advance':576,'rects':[[36+108*i,324,72,108]for i in range(5)]},'+':{'advance':432,'rects':[[144,162,72,432],[36,324,72,108],[252,324,72,108]]},' ':{'advance':216,'rects':[]},'\u00a0':{'advance':216,'rects':[]},'\u202f':{'advance':162,'rects':[]}})
order=['.notdef']+['u%04X'%ord(c)for c in glyphs];fb=FontBuilder(1000,isTTF=True);fb.setupGlyphOrder(order);fb.setupCharacterMap({ord(c):'u%04X'%ord(c)for c in glyphs});out={};metrics={}
for name,data in [('.notdef',{'advance':576,'rects':[]})]+[('u%04X'%ord(c),d)for c,d in glyphs.items()]:
 pen=TTGlyphPen(None)
 for x,y,w,h in data['rects']:
  pen.moveTo((x,y));pen.lineTo((x,y+h));pen.lineTo((x+w,y+h));pen.lineTo((x+w,y));pen.closePath()
 out[name]=pen.glyph();metrics[name]=(data['advance'],min([r[0]for r in data['rects']]or[0]))
fb.setupGlyf(out);fb.setupHorizontalMetrics(metrics);fb.setupHorizontalHeader(ascent=850,descent=-150);fb.setupNameTable({'familyName':'And Ride Digits','styleName':'Regular','uniqueFontIdentifier':'AndRideDigits-Regular-1.0','fullName':'And Ride Digits Regular','psName':'AndRideDigits-Regular','version':'Version 1.0','copyright':'Original numerals created for and Ride, 2026.'});fb.setupOS2(sTypoAscender=850,sTypoDescender=-150,usWinAscent=850,usWinDescent=150,sCapHeight=756,sxHeight=756);fb.setupPost();fb.setupMaxp()
assets=ROOT/'public/assets';fb.save(assets/'AndRideDigits-Regular.ttf');font=TTFont(assets/'AndRideDigits-Regular.ttf');font.flavor='woff2';font.save(assets/'AndRideDigits-Regular.woff2');(ROOT/'design/digits.json').write_text(json.dumps(glyphs,ensure_ascii=False,indent=2));print('Created TTF, WOFF2 and editable glyph geometry')
