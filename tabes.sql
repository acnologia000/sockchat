drop table inquiries;

create table inquiries (
    random_cid varchar(128),
    name varchar(500),
    question varchar(500),
    phone_number varchar(12),
    time varchar(20),
);

drop table if exists chat_messages;

create table messages (
    chat_id varchar(128),
    content text,
    message_time timestamp DEFAULT CURRENT_TIMESTAMP,
    unix_time varchar(20),
    sender_type char
);

create table chat_sessions (
    chat_id varchar(128),
    username varchar(200),
    start_time timestamp DEFAULT CURRENT_TIMESTAMP
);

insert into
    chat_sessions
values
    ($ 1, $ 2);

select
    content,
    sender_type
from
    messages
where
    chat_id = $ 1
order by
    unix_time asc;