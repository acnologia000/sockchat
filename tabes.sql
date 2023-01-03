drop table inquiries;

create table inquiries (
    name varchar(500),
    question varchar(500),
    phone_number varchar(12),
    time varchar(20),
);

drop table if exists chat_messages;

create table messages (
    chat_id varchar(128),
    content text,
    message_time timestamp DEFAULT CURRENT_TIMESTAMP(),
    unix_time varchar(20),
    sender_type char
);