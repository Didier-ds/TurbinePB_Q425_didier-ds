use std::io;

fn main() {
    let mut counter = 0;

    loop {
        println!("\nCounter: {}", counter);
        println!("Options: [i]ncrement, [d]ecrement, [r]eset, [q]uit");

        let mut input = String::new();
        io::stdin()
            .read_line(&mut input)
            .expect("Failed to read line");

        match input.trim() {
            "i" => counter += 1,
            "d" => counter -= 1,
            "r" => counter = 0,
            "q" => break,
            _ => println!("Invalid option!"),
        }
    }
}