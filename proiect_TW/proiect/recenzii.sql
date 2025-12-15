create table recenzii
(
    id_recenzie   int auto_increment
        primary key,
    id_utilizator int                    not null,
    id_produs     int                    not null,
    comentariu    text                   null,
    rating        int                    null
        check (`rating` between 1 and 5),
    data          date default curdate() not null,
    constraint recenzii_ibfk_1
        foreign key (id_utilizator) references utilizatori (id_utilizator),
    constraint recenzii_ibfk_2
        foreign key (id_produs) references produse (id_produs)
);

create index id_utilizator
    on recenzii (id_utilizator);

create index idx_recenzii_id_produs
    on recenzii (id_produs);

