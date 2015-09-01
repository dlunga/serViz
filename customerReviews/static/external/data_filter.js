/**
 * @author Dalton Lunga
 */

    var data = [ // <-A
        {count: 10, supplier_name: "Retail"},
        {count: 15, supplier_name: "Gas"},
        {count: 30, supplier_name: "Retail"},
        {count: 50, supplier_name: "Dining"},
        {count: 80, supplier_name: "Gas"},
        {count: 65, supplier_name: "Retail"},
        {count: 55, supplier_name: "Gas"},
        {count: 30, supplier_name: "Dining"},
        {count: 20, supplier_name: "Retail"},
        {count: 10, supplier_name: "Dining"},
        {count: 8, supplier_name: "Gas"}
    ];

    function render(data) {
        d3.select("#chart").selectAll("div.h-bar") // <-B
                .data(data)
            .enter().append("div")
            .attr("class", "h-bar")
            .append("span");

        d3.select("#chart").selectAll("div.h-bar") // <-C
                .data(data)
            .exit().remove();

        d3.select("#chart").selectAll("div.h-bar") // <-D
                .data(data)
            .attr("class", "h-bar")
            .style("width", function (d) {
                return (d.count * 5) + "px";
            })
            .select("span")
                .text(function (d) {
                    return d.supplier_name;
                });
    }

    render(data);

    function load(filename){ // <-E
        d3.json(filename, function(error, json){ // <-F
            data = data.concat(json);  
            render(data);
        });
    }