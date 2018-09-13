# IPython log file

sn = pd.read_table('crp_sectors.csv',header=None)
sn.columns = ['code','name']
sd = dict(zip(sn.code,sn.name))
d.update(sd)
json.dump(d,open('industry_names.json','w'))
