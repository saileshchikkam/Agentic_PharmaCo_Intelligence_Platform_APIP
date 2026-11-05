create role apip_adr_writer nologin inherit nosuperuser nocreatedb nocreaterole
  noreplication nobypassrls in role authenticated;
grant execute on function apip_adr.append_revision(uuid,integer,uuid,text,text,jsonb),
  apip_adr.find_command_receipt(uuid,integer,uuid,text,text),
  apip_adr.record_pdf_export(uuid,integer,uuid,text,text,integer) to apip_adr_writer;
