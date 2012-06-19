# -*- coding: utf-8 -*-
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Adding field 'Total.average'
        db.add_column('frontpages_total', 'average',
                      self.gf('django.db.models.fields.FloatField')(default=0),
                      keep_default=False)


    def backwards(self, orm):
        # Deleting field 'Total.average'
        db.delete_column('frontpages_total', 'average')


    models = {
        'frontpages.article': {
            'Meta': {'object_name': 'Article'},
            'article_date': ('django.db.models.fields.DateField', [], {'null': 'True', 'blank': 'True'}),
            'category': ('django.db.models.fields.CharField', [], {'max_length': '100', 'blank': 'True'}),
            'corrections': ('django.db.models.fields.IntegerField', [], {'default': '0', 'blank': 'True'}),
            'harvested': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'illustrated': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'newspaper_id': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'}),
            'newspaper_title': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'page': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'}),
            'page_text': ('django.db.models.fields.CharField', [], {'max_length': '20', 'null': 'True', 'blank': 'True'}),
            'page_url': ('django.db.models.fields.URLField', [], {'max_length': '200', 'blank': 'True'}),
            'status': ('django.db.models.fields.CharField', [], {'default': "'yes'", 'max_length': '5'}),
            'title': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'trove_id': ('django.db.models.fields.IntegerField', [], {}),
            'url': ('django.db.models.fields.URLField', [], {'max_length': '200', 'blank': 'True'}),
            'word_count': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'})
        },
        'frontpages.newspaper': {
            'Meta': {'object_name': 'Newspaper'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'newspaper_id': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'}),
            'newspaper_title': ('django.db.models.fields.TextField', [], {'blank': 'True'})
        },
        'frontpages.total': {
            'Meta': {'object_name': 'Total'},
            'average': ('django.db.models.fields.FloatField', [], {'default': '0'}),
            'category': ('django.db.models.fields.CharField', [], {'max_length': '50', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'month': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'}),
            'newspaper': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['frontpages.Newspaper']", 'null': 'True'}),
            'total_type': ('django.db.models.fields.CharField', [], {'max_length': '50', 'blank': 'True'}),
            'value': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'year': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'})
        }
    }

    complete_apps = ['frontpages']