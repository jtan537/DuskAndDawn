using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class MoveUpDown : MonoBehaviour
{
    private bool move;
    public GameObject floor;
    public GameObject top;
    private int speed = 10;

    // Start is called before the first frame update
    void Start()
    {
        move = true;
    }

    // Update is called once per frame
    void FixedUpdate()
    {
        if (move == true){
            transform.Translate(Vector2.up * speed * Time.deltaTime);
        }
        else if (move == false){
            transform.Translate(Vector2.down * speed * Time.deltaTime);
        }
        // print(Vector3.Distance(gameObject.transform.position, top.transform.position));
        if (Vector3.Distance(gameObject.transform.position, floor.transform.position) < 5){
            move = true;
        }
        else if (Vector3.Distance(gameObject.transform.position, top.transform.position) < 5){
            move = false;
        }
    }
}
