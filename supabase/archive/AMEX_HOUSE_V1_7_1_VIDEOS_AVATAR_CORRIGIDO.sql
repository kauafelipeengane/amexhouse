-- AMEX HOUSE V1.7.1
-- Corrige a regra antiga que proibia reutilizar um curso longo como apoio em aulas diferentes.
begin;

create or replace function public.validate_unique_video_source()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
 if new.youtube_id is null or new.youtube_id !~ '^[A-Za-z0-9_-]{11}$' then
  raise exception 'O vídeo principal precisa ter um ID válido do YouTube' using errcode='22023';
 end if;
 if new.alternative_youtube_id is not null and new.alternative_youtube_id<>'' and new.alternative_youtube_id !~ '^[A-Za-z0-9_-]{11}$' then
  raise exception 'O vídeo alternativo precisa ter um ID válido do YouTube' using errcode='22023';
 end if;
 if nullif(new.alternative_youtube_id,'')=new.youtube_id then
  raise exception 'O vídeo alternativo deve ser diferente do vídeo principal da mesma aula' using errcode='22023';
 end if;
 return new;
end $$;
revoke all on function public.validate_unique_video_source() from public,anon,authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('avatars','avatars',false,1048576,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=false,file_size_limit=1048576,allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists "avatars_select_own" on storage.objects;
drop policy if exists "avatars_insert_own" on storage.objects;
drop policy if exists "avatars_update_own" on storage.objects;
drop policy if exists "avatars_delete_own" on storage.objects;
create policy "avatars_select_own" on storage.objects for select to authenticated using(bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "avatars_insert_own" on storage.objects for insert to authenticated with check(bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text and lower(storage.extension(name)) in('jpg','jpeg','png','webp'));
create policy "avatars_update_own" on storage.objects for update to authenticated using(bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text) with check(bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "avatars_delete_own" on storage.objects for delete to authenticated using(bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text);

insert into public.lesson_videos(lesson_id,youtube_id,title,channel,is_embed_allowed,reviewed_at)
select l.id,
 case
  when c.slug like 'javascript%' or c.slug in('typescript-arquitetura','react-interfaces','node-backend','bancos-javascript','testes-javascript','fullstack-producao') then 'PkZNo7MFNFg'
  when c.slug in('dados-fundamentos','sql-profissional','postgresql-modelagem','python-analise-dados','visualizacao-dados','estatistica-aplicada','machine-learning-fundamentos','engenharia-dados','bi-storytelling') then 'PSNXoAs2FtQ'
  when c.slug in('linux-administracao','redes-devops','git-colaboracao','ci-cd','docker-containers','cloud-fundamentos','terraform-iac','kubernetes-orquestracao','sre-observabilidade') then 'kTp5xUtcalw'
  when c.slug like 'python%' then 'rfscVS0vtbw'
  else '3Kq1MIfTWCE'
 end,
 'Vídeo de apoio: '||l.title,'freeCodeCamp.org',true,now()
from public.lessons l
join public.course_modules m on m.id=l.module_id
join public.courses c on c.id=m.course_id
where l.status='published'
 and not exists(select 1 from public.lesson_videos v where v.lesson_id=l.id)
on conflict(lesson_id) do nothing;

do $$ declare missing integer; begin
 select count(*) into missing
 from public.lessons l
 where l.status='published'
  and not exists(select 1 from public.lesson_videos v where v.lesson_id=l.id and v.youtube_id~'^[A-Za-z0-9_-]{11}$');
 if missing<>0 then raise exception 'Existem % aulas publicadas sem vídeo válido',missing; end if;
end $$;

commit;
